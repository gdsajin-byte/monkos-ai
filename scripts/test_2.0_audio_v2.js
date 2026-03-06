/**
 * test_2.0_audio_v2.js — 2.0 모델 AUDIO + 이미지 재검증
 *
 * 이전 Test B 실패 원인 분석:
 *   - 1x1 미니 JPEG + sendClientContent({ turnComplete: true }) 사용
 *   - 프로덕션은 sendRealtimeInput으로 연속 스트리밍, turnComplete 미사용
 *
 * 이번 테스트:
 *   - Test B1: 프로덕션 패턴 — 프레임 연속 스트리밍(500ms 간격, 5회) + 텍스트 프롬프트
 *   - Test B2: sendClientContent에 이미지+텍스트 동시 전달 (비스트리밍)
 *   - Test B3: 이미지만 sendRealtimeInput (turnComplete 없이 대기)
 *
 * 실행: cd monkos_AI/idphoto-kr && node ../../scripts/test_2.0_audio_v2.js
 */

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const PROJECT_ID = 'monkos';
const LOCATION = 'us-central1';
const MODEL_20 = 'gemini-2.0-flash-live-preview-04-09';
const OUTPUT_DIR = join(homedir(), 'Desktop', '쌍아', 'voice_samples');

// 128x128 실제 크기 테스트 이미지 생성 (canvas 사용 또는 순수 JPEG)
function makeTestJpeg() {
  // 최소한의 유효 JPEG — 8x8 (실제 콘텐츠 있는 이미지)
  // 더 나은 방법: 프로덕션처럼 실제 크기 이미지 사용
  // canvas 패키지 없이 base64로 제공
  const minJpeg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABAAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiY3LwgnKDk4OSkqSlpscHJ0dXZxiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDtrW1tooYz5765qtvEi26TFHhBxkHO4e+cYJ9aga3cTsNxCg8H1ptFeijjIkDQYP8ArW/SpGjbA+dj9TVeigCR1fGd7VEUJHTNAooAcqkjtTiCBxTB0p9ABRRRQAUUUUAFKBS0oFACU6iigD/2Q==';
  return minJpeg;
}

function pcmToWav(pcmBuffer, sampleRate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcmBuffer.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([h, pcmBuffer]);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function runLiveTest(ai, testName, config, inputFn, timeoutMs = 20000) {
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
              done = true; clearTimeout(timer);
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
  console.log('2.0 모델 AUDIO + 이미지 재검증 (프로덕션 패턴)');
  console.log(`모델: ${MODEL_20}`);
  console.log('='.repeat(60));

  const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const testImage = makeTestJpeg();
  console.log(`테스트 이미지: 64x64 JPEG (base64 ${testImage.length}자)`);

  // ─── Test B1: 프로덕션 패턴 — 연속 프레임 + 텍스트 프롬프트 ───
  console.log('\n=== Test B1: 프로덕션 패턴 (프레임 스트리밍 + 텍스트) ===\n');

  const testB1 = await runLiveTest(ai, 'B1-스트리밍',
    {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: { parts: [{ text: '몽코스 AI 코치입니다. 이 사람의 증명사진 촬영을 도와주세요. 한국어 1문장으로 코칭해주세요.' }] },
    },
    async (session) => {
      // 프레임 5회 전송 (500ms 간격 = 프로덕션 패턴)
      for (let i = 0; i < 5; i++) {
        await session.sendRealtimeInput({
          media: { data: testImage, mimeType: 'image/jpeg' },
        });
        console.log(`    프레임 ${i + 1}/5 전송`);
        if (i < 4) await sleep(500);
      }
      // 텍스트 프롬프트로 응답 유도
      await session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: '이 사진에서 자세를 코칭해주세요' }] }],
        turnComplete: true,
      });
      console.log('    텍스트 프롬프트 전송');
    },
    25000,
  );

  printTestResult('B1', testB1);
  if (testB1.pcmBuffer) {
    const wav = pcmToWav(testB1.pcmBuffer);
    writeFileSync(join(OUTPUT_DIR, '_2.0_B1_stream_audio.wav'), wav);
    console.log(`  WAV 저장: _2.0_B1_stream_audio.wav`);
  }

  // ─── Test B2: sendClientContent에 이미지+텍스트 동시 (비스트리밍) ───
  console.log('\n=== Test B2: sendClientContent 이미지+텍스트 (비스트리밍) ===\n');

  const testB2 = await runLiveTest(ai, 'B2-비스트리밍',
    {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: { parts: [{ text: '몽코스 AI 코치입니다. 한국어 1문장으로 코칭해주세요.' }] },
    },
    async (session) => {
      await session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: testImage } },
            { text: '이 사진에서 자세를 코칭해주세요' },
          ],
        }],
        turnComplete: true,
      });
      console.log('    이미지+텍스트 전송 (sendClientContent)');
    },
  );

  printTestResult('B2', testB2);
  if (testB2.pcmBuffer) {
    const wav = pcmToWav(testB2.pcmBuffer);
    writeFileSync(join(OUTPUT_DIR, '_2.0_B2_content_audio.wav'), wav);
    console.log(`  WAV 저장: _2.0_B2_content_audio.wav`);
  }

  // ─── Test B3: sendRealtimeInput만 (turnComplete 없이 대기) ───
  console.log('\n=== Test B3: sendRealtimeInput만 (turnComplete 없이, 15초 대기) ===\n');

  const testB3 = await runLiveTest(ai, 'B3-프레임만',
    {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: { parts: [{ text: '몽코스 AI 코치입니다. 카메라 프레임을 보고 즉시 한국어로 코칭해주세요. 매 프레임마다 한마디.' }] },
    },
    async (session) => {
      // 프레임 10회 전송 (500ms 간격)
      for (let i = 0; i < 10; i++) {
        await session.sendRealtimeInput({
          media: { data: testImage, mimeType: 'image/jpeg' },
        });
        console.log(`    프레임 ${i + 1}/10 전송`);
        await sleep(500);
      }
      console.log('    프레임 전송 완료 — turnComplete 없이 15초 대기');
    },
    20000,
  );

  printTestResult('B3', testB3);
  if (testB3.pcmBuffer) {
    const wav = pcmToWav(testB3.pcmBuffer);
    writeFileSync(join(OUTPUT_DIR, '_2.0_B3_frame_audio.wav'), wav);
    console.log(`  WAV 저장: _2.0_B3_frame_audio.wav`);
  }

  // ─── 결과 요약 ───
  console.log('\n' + '='.repeat(60));
  console.log('재검증 결과 요약');
  console.log('='.repeat(60));

  console.log('\n| 테스트 | 방식 | AUDIO | 레이턴시 |');
  console.log('|--------|------|-------|---------|');
  printRow('B1', '스트리밍+텍스트', testB1);
  printRow('B2', 'Content 이미지+텍스트', testB2);
  printRow('B3', '프레임만(턴없음)', testB3);

  const anySuccess = [testB1, testB2, testB3].some(t => t.success && t.audioBytes > 0);
  if (anySuccess) {
    console.log('\n→ ✅ 이미지+AUDIO 조합 가능! Phase 2 진행 가능.');
  } else {
    console.log('\n→ ❌ 2.0 모델에서 이미지+AUDIO 조합 불가 확정.');
    console.log('   TEXT 코칭은 정상. AUDIO는 텍스트 입력에서만 작동.');
  }

  // JSON 저장
  const json = {
    testB1: { ...testB1, pcmBuffer: undefined },
    testB2: { ...testB2, pcmBuffer: undefined },
    testB3: { ...testB3, pcmBuffer: undefined },
    model: MODEL_20,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(OUTPUT_DIR, '_2.0_audio_v2_results.json'), JSON.stringify(json, null, 2));
  console.log(`\n결과 JSON: ${join(OUTPUT_DIR, '_2.0_audio_v2_results.json')}`);
}

function printTestResult(name, result) {
  if (result.success && result.audioBytes > 0) {
    console.log(`  ✅ ${name}: AUDIO 수신 — ${result.audioChunks}청크, ${result.audioBytes}B, 레이턴시=${result.latencyMs}ms`);
  } else if (result.success && result.textChunks > 0) {
    console.log(`  ⚠️ ${name}: 텍스트로 응답됨 — "${result.texts.join('')}"`);
  } else {
    console.log(`  ❌ ${name}: 응답 없음 — error=${result.error || 'null'}, totalMs=${result.totalMs}`);
  }
}

function printRow(name, method, result) {
  const status = result.success && result.audioBytes > 0
    ? `✅ ${result.audioBytes}B`
    : result.success && result.textChunks > 0
    ? `⚠️ 텍스트`
    : `❌`;
  const lat = result.latencyMs ? `${result.latencyMs}ms` : '-';
  console.log(`| ${name} | ${method} | ${status} | ${lat} |`);
}

main().catch(err => {
  console.error('치명적 에러:', err);
  process.exit(1);
});
