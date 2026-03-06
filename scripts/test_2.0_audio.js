/**
 * test_2.0_audio.js — 현행 2.0 모델 AUDIO modality 검증
 *
 * 모델: gemini-2.0-flash-live-preview-04-09 (변경 없음)
 * 목적: responseModalities: ['AUDIO'] 지원 여부 확인
 *
 * 검증 항목:
 *   1. AUDIO responseModality 지원 여부
 *   2. 이미지 프레임 입력 + AUDIO 응답
 *   3. 첫 청크 레이턴시 (2.5 native audio ~2초와 비교)
 *   4. PCM 포맷 확인
 *
 * 실행: cd monkos_AI/idphoto-kr && node ../../scripts/test_2.0_audio.js
 */

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECT_ID = 'monkos';
const LOCATION = 'us-central1';
const MODEL_20 = 'gemini-2.0-flash-live-preview-04-09';
const OUTPUT_DIR = join(homedir(), 'Desktop', '쌍아', 'voice_samples');

function pcmToWav(pcmBuffer, sampleRate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcmBuffer.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([h, pcmBuffer]);
}

function runLiveTest(ai, testName, config, inputFn, timeoutMs = 15000) {
  return new Promise(async (resolve) => {
    const audioChunks = [];
    const textChunks = [];
    let done = false;
    let firstChunkTime = null;
    const startTime = Date.now();

    const timer = setTimeout(() => {
      if (!done) { done = true; try { session?.close(); } catch {} finish(); }
    }, timeoutMs);

    function finish() {
      clearTimeout(timer);
      const totalAudio = audioChunks.reduce((s, c) => s + c.length, 0);
      const latency = firstChunkTime ? firstChunkTime - startTime : null;
      resolve({
        success: audioChunks.length > 0 || textChunks.length > 0,
        audioChunks: audioChunks.length,
        audioBytes: totalAudio,
        textChunks: textChunks.length,
        texts: textChunks,
        latencyMs: latency,
        totalMs: Date.now() - startTime,
        pcmBuffer: totalAudio > 0 ? Buffer.concat(audioChunks) : null,
        error: null,
      });
    }

    let session;
    try {
      session = await ai.live.connect({
        model: MODEL_20,
        config,
        callbacks: {
          onopen: () => console.log(`    [${testName}] 세션 연결`),
          onclose: () => { if (!done) { done = true; finish(); } },
          onerror: (e) => {
            console.log(`    [${testName}] 에러: ${e?.message || e}`);
            if (!done) {
              done = true;
              clearTimeout(timer);
              resolve({ success: false, error: e?.message || String(e),
                audioChunks: 0, audioBytes: 0, textChunks: 0, texts: [], latencyMs: null, totalMs: Date.now() - startTime, pcmBuffer: null });
            }
          },
          onmessage: (msg) => {
            if (msg?.serverContent?.turnComplete) {
              console.log(`    [${testName}] turnComplete — 오디오 ${audioChunks.length}청크, 텍스트 ${textChunks.length}건`);
              if (!done) { done = true; try { session?.close(); } catch {} finish(); }
              return;
            }
            const parts = msg?.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const p of parts) {
                if (p.inlineData?.data) {
                  if (!firstChunkTime) firstChunkTime = Date.now();
                  audioChunks.push(Buffer.from(p.inlineData.data, 'base64'));
                }
                if (p.text) {
                  if (!firstChunkTime) firstChunkTime = Date.now();
                  textChunks.push(p.text);
                }
              }
            }
          },
        },
      });

      await inputFn(session);

    } catch (err) {
      clearTimeout(timer);
      console.log(`    [${testName}] 연결 실패: ${err.message}`);
      resolve({ success: false, error: err.message,
        audioChunks: 0, audioBytes: 0, textChunks: 0, texts: [], latencyMs: null, totalMs: Date.now() - startTime, pcmBuffer: null });
    }
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('현행 2.0 모델 AUDIO modality 검증');
  console.log(`모델: ${MODEL_20}`);
  console.log('='.repeat(60));

  const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // ─── Test A: AUDIO modality 지원 여부 ───
  console.log('\n=== Test A: AUDIO responseModality 지원 여부 ===\n');

  const testA = await runLiveTest(ai, 'AUDIO-기본',
    {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: { parts: [{ text: '한국어로 짧게 인사해주세요.' }] },
    },
    async (session) => {
      await session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: '안녕하세요' }] }],
        turnComplete: true,
      });
      console.log('    입력 전송: "안녕하세요"');
    },
  );

  if (testA.success && testA.audioBytes > 0) {
    console.log(`  ✅ AUDIO 지원됨! — ${testA.audioChunks}청크, ${testA.audioBytes}B, 레이턴시=${testA.latencyMs}ms`);
    if (testA.pcmBuffer) {
      const wav = pcmToWav(testA.pcmBuffer);
      writeFileSync(join(OUTPUT_DIR, '_2.0_audio_test.wav'), wav);
      console.log(`  WAV 저장: _2.0_audio_test.wav (${wav.length}B)`);
    }
  } else if (testA.success && testA.textChunks > 0) {
    console.log(`  ⚠️ 텍스트로 응답됨 (AUDIO 미지원 가능): "${testA.texts.join('')}"`);
  } else {
    console.log(`  ❌ 실패: ${testA.error}`);
    console.log('\n  → Phase 1 불통과. Phase 2~4 진행 불가.');
    printResult(testA, null, null);
    return;
  }

  // ─── Test B: 이미지 + AUDIO 응답 ───
  console.log('\n=== Test B: 이미지 프레임 입력 + AUDIO 응답 ===\n');

  // 간단한 테스트 이미지 (1x1 JPEG 대체 — base64)
  // 실제 JPEG: 최소한의 유효한 JFIF (빈 이미지보단 약간의 콘텐츠)
  const minJpeg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAAIAAgDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=', 'base64').toString('base64');

  const testB = await runLiveTest(ai, 'AUDIO-이미지',
    {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: { parts: [{ text: '몽코스 AI 코치입니다. 한국어 1문장, 15자 이내로 코칭해주세요.' }] },
    },
    async (session) => {
      await session.sendRealtimeInput({
        media: { data: minJpeg, mimeType: 'image/jpeg' },
      });
      await session.sendClientContent({ turnComplete: true });
      console.log('    이미지 프레임 전송');
    },
  );

  if (testB.success && testB.audioBytes > 0) {
    console.log(`  ✅ 이미지+AUDIO 성공 — ${testB.audioChunks}청크, ${testB.audioBytes}B, 레이턴시=${testB.latencyMs}ms`);
    if (testB.pcmBuffer) {
      const wav = pcmToWav(testB.pcmBuffer);
      writeFileSync(join(OUTPUT_DIR, '_2.0_image_audio.wav'), wav);
    }
  } else {
    console.log(`  ❌ 실패: ${testB.error || '오디오 미수신'}`);
    if (testB.textChunks > 0) console.log(`  텍스트 응답: "${testB.texts.join('')}"`);
  }

  // ─── Test C: TEXT 모드 레이턴시 비교 (베이스라인) ───
  console.log('\n=== Test C: TEXT 모드 레이턴시 (베이스라인 비교용) ===\n');

  const testC = await runLiveTest(ai, 'TEXT-베이스라인',
    {
      responseModalities: ['TEXT'],
      systemInstruction: { parts: [{ text: '한국어로 짧게 인사해주세요.' }] },
    },
    async (session) => {
      await session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: '안녕하세요' }] }],
        turnComplete: true,
      });
      console.log('    입력 전송: "안녕하세요" (TEXT 모드)');
    },
  );

  if (testC.success) {
    console.log(`  ✅ TEXT 응답: "${testC.texts.join('')}" — 레이턴시=${testC.latencyMs}ms`);
  } else {
    console.log(`  ❌ 실패: ${testC.error}`);
  }

  printResult(testA, testB, testC);
}

function printResult(testA, testB, testC) {
  console.log('\n' + '='.repeat(60));
  console.log('검증 결과 요약');
  console.log('='.repeat(60));

  console.log('\n| 테스트 | 결과 | 오디오 | 레이턴시 |');
  console.log('|--------|------|--------|---------|');

  const fmtA = testA.success && testA.audioBytes > 0
    ? `✅ | ${testA.audioBytes}B | ${testA.latencyMs}ms`
    : `❌ | ${testA.error || 'N/A'} | -`;
  console.log(`| A: AUDIO 지원 | ${fmtA} |`);

  if (testB) {
    const fmtB = testB.success && testB.audioBytes > 0
      ? `✅ | ${testB.audioBytes}B | ${testB.latencyMs}ms`
      : `❌ | ${testB.error || 'N/A'} | -`;
    console.log(`| B: 이미지+AUDIO | ${fmtB} |`);
  }

  if (testC) {
    const fmtC = testC.success
      ? `✅ | (텍스트) | ${testC.latencyMs}ms`
      : `❌ | ${testC.error} | -`;
    console.log(`| C: TEXT 베이스라인 | ${fmtC} |`);
  }

  if (testA.success && testA.audioBytes > 0) {
    console.log('\n비교표:');
    console.log('| 모델 | 모드 | 레이턴시 |');
    console.log('|------|------|---------|');
    console.log(`| 2.0 live-preview | TEXT | ${testC?.latencyMs || 'N/A'}ms |`);
    console.log(`| 2.0 live-preview | AUDIO | ${testA.latencyMs}ms |`);
    console.log(`| 2.5 native-audio | AUDIO | ~2000ms (이전 검증) |`);
    console.log(`\n→ Phase 1 통과. Phase 2~4 진행 가능.`);
  } else {
    console.log(`\n→ Phase 1 불통과. AUDIO modality 미지원.`);
  }

  // JSON 저장
  const json = { testA, testB, testC, model: MODEL_20, timestamp: new Date().toISOString() };
  // pcmBuffer는 JSON에서 제거
  delete json.testA?.pcmBuffer;
  if (json.testB) delete json.testB.pcmBuffer;
  writeFileSync(join(OUTPUT_DIR, '_2.0_audio_results.json'), JSON.stringify(json, null, 2));
  console.log(`\n결과 JSON: ${join(OUTPUT_DIR, '_2.0_audio_results.json')}`);
}

main().catch(err => {
  console.error('치명적 에러:', err);
  process.exit(1);
});
