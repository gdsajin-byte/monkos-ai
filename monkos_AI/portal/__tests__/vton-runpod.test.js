/**
 * VTON pod 제어 RunPod REST v2 요청 형식·상태 판정 (fetch 모킹 — 실제 start/stop 호출 없음)
 * 스키마 근거: https://api.runpod.io/v2/openapi.json (getPod, podAction, PodStatus)
 */

import { jest } from '@jest/globals';

const log = jest.fn();
jest.unstable_mockModule('../lib/shared/config.js', () => ({
  RUNPOD_API_KEY: 'test-key',
  RUNPOD_POD_ID: 'pod123',
  log,
}));
jest.unstable_mockModule('../lib/cms/admin-auth.js', () => ({
  requireAdmin: () => true,
}));

const { handlePodStart, handlePodStatus, handlePodStop } = await import('../lib/vton/runpod.js');

const POD_URL = 'https://api.runpod.io/v2/pods/pod123';
const COMFY_URL = 'https://pod123-8188.proxy.runpod.net/system_stats';

function mockRes() {
  return {
    writeHead(status) { this.status = status; },
    end(body) { this.body = JSON.parse(body); },
  };
}

function mockFetch(handler) {
  global.fetch = jest.fn(async (url, init) => handler(url, init));
}

afterEach(() => {
  delete global.fetch;
  log.mockClear();
});

describe('전원 제어 요청 형식', () => {
  test.each([
    ['start', handlePodStart],
    ['stop', handlePodStop],
  ])('%s: POST /v2/pods/{id}/action + {"action"} + Bearer', async (action, handler) => {
    mockFetch(() => ({ ok: true, status: 200 }));
    const res = mockRes();
    await handler({}, res);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe(`${POD_URL}/action`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ action });
    expect(init.headers.Authorization).toBe('Bearer test-key');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('start 실패(409 등)는 502 + 재시도 안내', async () => {
    mockFetch(() => ({ ok: false, status: 409 }));
    const res = mockRes();
    await handlePodStart({}, res);
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ ok: false, runpodStatus: 409 });
    expect(res.body.message).toContain('재시도');
  });

  test('네트워크 오류는 502 + ERROR 로그', async () => {
    mockFetch(() => { throw new Error('boom'); });
    const res = mockRes();
    await handlePodStop({}, res);
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ ok: false, error: 'boom' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('boom'), 'ERROR');
  });
});

describe('상태 판정', () => {
  function podIs(status, comfyOk = true) {
    mockFetch((url) => {
      if (url === POD_URL) return { ok: true, status: 200, json: async () => ({ id: 'pod123', status }) };
      if (url === COMFY_URL) return { ok: comfyOk };
      throw new Error(`예상 밖 URL: ${url}`);
    });
  }

  test('GET /v2/pods/{id}, RUNNING + ComfyUI 정상 → 준비', async () => {
    podIs('RUNNING');
    const res = mockRes();
    await handlePodStatus({}, res);
    expect(global.fetch.mock.calls[0][0]).toBe(POD_URL);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ podId: 'pod123', podStatus: 'RUNNING', running: true, comfyReady: true });
  });

  test.each(['PROVISIONING', 'STARTING'])('%s: 부팅 중 → running 유지, ComfyUI 미조회', async (status) => {
    podIs(status);
    const res = mockRes();
    await handlePodStatus({}, res);
    expect(res.body).toMatchObject({ podStatus: status, running: true, comfyReady: false });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test.each(['EXITED', 'ERROR', 'TERMINATED'])('%s: 꺼짐', async (status) => {
    podIs(status);
    const res = mockRes();
    await handlePodStatus({}, res);
    expect(res.body).toMatchObject({ podStatus: status, running: false, comfyReady: false });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('429 처리 — 재시도 없이 명시', () => {
  test('status: 502 + 로그·메시지에 한도 초과', async () => {
    mockFetch(() => ({ ok: false, status: 429 }));
    const res = mockRes();
    await handlePodStatus({}, res);
    expect(res.status).toBe(502);
    expect(res.body.error).toContain('429');
    expect(res.body.error).toContain('요청 한도 초과 — 잠시 후 재시도');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('429'), 'ERROR');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['start', handlePodStart],
    ['stop', handlePodStop],
  ])('%s: 502 + 로그·메시지에 한도 초과', async (_action, handler) => {
    mockFetch(() => ({ ok: false, status: 429 }));
    const res = mockRes();
    await handler({}, res);
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ ok: false, runpodStatus: 429, message: '요청 한도 초과 — 잠시 후 재시도' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('429'), 'WARNING');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
