/**
 * test_live_audio.js — Gemini Live Native Audio 모델 검증 스크립트
 *
 * Phase A 검증 (SPEC_20260306):
 *   Step 1: 모델 접근성 (Vertex AI ADC)
 *   Step 2: 한국어/일본어 음성 검증
 *   Step 3: 3보이스 시연 (Kore, Puck, Aoede) → WAV 저장
 *   Step 4: 이미지 입력 + AUDIO 응답 통합 테스트
 *
 * 실행: node scripts/test_live_audio.js
 * 의존: @google/genai (monkos_AI/idphoto-kr/node_modules에서 resolve)
 */

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// === 설정 ===
const PROJECT_ID = 'monkos';
const LOCATION = 'us-central1';
const MODEL = 'gemini-live-2.5-flash-native-audio';
const OUTPUT_DIR = join(homedir(), 'Desktop', '쌍아', 'voice_samples');

const VOICES = [
  { name: 'Kore', desc: 'Firm (단단하고 명확)' },
  { name: 'Puck', desc: 'Bright (밝고 친근)' },
  { name: 'Aoede', desc: '중성적' },
];

const KR_COACHING_TEXT = '고개를 살짝 오른쪽으로. 좋아요, 지금 촬영하세요!';
const KR_SYSTEM = `몽코스 AI 코치입니다. 반드시 한국어로 응답하세요.
다음 문장을 자연스럽게 말해주세요:`;

const JP_SYSTEM = `モンコスAIコーチです。必ず日本語で応答してください。
次の文を自然に言ってください:`;
const JP_COACHING_TEXT = '少し右を向いてください。いいですね、今撮影してください！';

// === PCM → WAV 변환 ===
function pcmToWav(pcmBuffer, sampleRate = 24000, bitsPerSample = 16, channels = 1) {
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);           // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  header.writeUInt16LE(channels * bitsPerSample / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// === Live 세션 헬퍼: 텍스트 입력 → AUDIO 수집 ===
function collectAudioFromLive(ai, voiceName, systemText, inputText, timeoutMs = 15000) {
  return new Promise(async (resolve, reject) => {
    const audioChunks = [];
    let sessionDone = false;
    const startTime = Date.now();

    const timer = setTimeout(() => {
      if (!sessionDone) {
        sessionDone = true;
        try { session?.close(); } catch {}
        if (audioChunks.length > 0) {
          resolve({ audioChunks, latencyMs: Date.now() - startTime });
        } else {
          reject(new Error(`타임아웃 (${timeoutMs}ms) — 오디오 미수신`));
        }
      }
    }, timeoutMs);

    let session;
    try {
      session = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          },
          systemInstruction: { parts: [{ text: systemText }] },
        },
        callbacks: {
          onopen: () => {
            console.log(`    [${voiceName}] 세션 연결 완료`);
          },
          onclose: (e) => {
            console.log(`    [${voiceName}] 세션 종료: ${e?.code || 'unknown'}`);
            if (!sessionDone) {
              sessionDone = true;
              clearTimeout(timer);
              resolve({ audioChunks, latencyMs: Date.now() - startTime });
            }
          },
          onerror: (e) => {
            console.log(`    [${voiceName}] 에러: ${e?.message || e}`);
            if (!sessionDone) {
              sessionDone = true;
              clearTimeout(timer);
              reject(new Error(e?.message || String(e)));
            }
          },
          onmessage: (msg) => {
            // turnComplete → 응답 완료
            if (msg?.serverContent?.turnComplete) {
              console.log(`    [${voiceName}] turnComplete — 청크 ${audioChunks.length}개 수집`);
              if (!sessionDone) {
                sessionDone = true;
                clearTimeout(timer);
                try { session?.close(); } catch {}
                resolve({ audioChunks, latencyMs: Date.now() - startTime });
              }
              return;
            }

            // 오디오 파트 수집
            const parts = msg?.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
                }
                if (part.text) {
                  console.log(`    [${voiceName}] 텍스트 응답: ${part.text}`);
                }
              }
            }
          },
        },
      });

      // 텍스트 입력 전송
      await session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: inputText }] }],
        turnComplete: true,
      });
      console.log(`    [${voiceName}] 입력 전송: "${inputText.substring(0, 30)}..."`);

    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// === Live 세션 헬퍼: 이미지 입력 → AUDIO 수집 ===
function collectAudioFromImage(ai, voiceName, systemText, imageBase64, timeoutMs = 20000) {
  return new Promise(async (resolve, reject) => {
    const audioChunks = [];
    let sessionDone = false;
    let firstChunkTime = null;
    const startTime = Date.now();

    const timer = setTimeout(() => {
      if (!sessionDone) {
        sessionDone = true;
        try { session?.close(); } catch {}
        if (audioChunks.length > 0) {
          resolve({ audioChunks, latencyMs: firstChunkTime ? firstChunkTime - startTime : Date.now() - startTime });
        } else {
          reject(new Error(`타임아웃 (${timeoutMs}ms) — 오디오 미수신`));
        }
      }
    }, timeoutMs);

    let session;
    try {
      session = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          },
          systemInstruction: { parts: [{ text: systemText }] },
        },
        callbacks: {
          onopen: () => console.log(`    [이미지 테스트] 세션 연결 완료`),
          onclose: () => {
            if (!sessionDone) {
              sessionDone = true;
              clearTimeout(timer);
              resolve({ audioChunks, latencyMs: firstChunkTime ? firstChunkTime - startTime : Date.now() - startTime });
            }
          },
          onerror: (e) => {
            if (!sessionDone) {
              sessionDone = true;
              clearTimeout(timer);
              reject(new Error(e?.message || String(e)));
            }
          },
          onmessage: (msg) => {
            if (msg?.serverContent?.turnComplete) {
              console.log(`    [이미지 테스트] turnComplete — 청크 ${audioChunks.length}개`);
              if (!sessionDone) {
                sessionDone = true;
                clearTimeout(timer);
                try { session?.close(); } catch {}
                resolve({ audioChunks, latencyMs: firstChunkTime ? firstChunkTime - startTime : Date.now() - startTime });
              }
              return;
            }

            const parts = msg?.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  if (!firstChunkTime) firstChunkTime = Date.now();
                  audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
                }
                if (part.text) {
                  console.log(`    [이미지 테스트] 텍스트: ${part.text}`);
                }
              }
            }
          },
        },
      });

      // 이미지 프레임 전송
      await session.sendRealtimeInput({
        media: { data: imageBase64, mimeType: 'image/jpeg' },
      });
      // turnComplete 신호
      await session.sendClientContent({ turnComplete: true });
      console.log(`    [이미지 테스트] JPEG 프레임 전송 완료`);

    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// === 메인 ===
async function main() {
  console.log('='.repeat(60));
  console.log('Gemini Live Native Audio 모델 검증');
  console.log(`모델: ${MODEL}`);
  console.log(`프로젝트: ${PROJECT_ID} / 리전: ${LOCATION}`);
  console.log(`출력: ${OUTPUT_DIR}`);
  console.log('='.repeat(60));

  const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = {
    step1: null,
    step2_kr: null,
    step2_jp: null,
    step3: {},
    step4: null,
  };

  // ─── Step 1: 모델 접근성 검증 ───
  console.log('\n=== Step 1: 모델 접근성 검증 ===\n');
  try {
    const { audioChunks, latencyMs } = await collectAudioFromLive(
      ai, 'Kore',
      '한국어로 짧게 인사해주세요.',
      '안녕하세요',
      15000
    );

    const totalBytes = audioChunks.reduce((s, c) => s + c.length, 0);
    console.log(`\n  ✅ 모델 접근 성공`);
    console.log(`  오디오 청크: ${audioChunks.length}개, 총 ${totalBytes} bytes`);
    console.log(`  지연 시간: ${latencyMs}ms`);

    if (totalBytes > 0) {
      const pcm = Buffer.concat(audioChunks);
      const wav = pcmToWav(pcm);
      const testPath = join(OUTPUT_DIR, '_step1_access_test.wav');
      writeFileSync(testPath, wav);
      console.log(`  WAV 저장: ${testPath} (${wav.length} bytes)`);
    }

    results.step1 = { success: true, chunks: audioChunks.length, bytes: totalBytes, latencyMs };
  } catch (err) {
    console.log(`\n  ❌ 모델 접근 실패: ${err.message}`);
    results.step1 = { success: false, error: err.message };
    // Step 1 실패 시 나머지 스킵
    printSummary(results);
    return;
  }

  // ─── Step 2: 한국어/일본어 음성 검증 ───
  console.log('\n=== Step 2: 한국어/일본어 음성 검증 ===\n');

  // 한국어
  console.log('  [KR] 한국어 코칭 테스트:');
  try {
    const { audioChunks, latencyMs } = await collectAudioFromLive(
      ai, 'Kore',
      KR_SYSTEM,
      KR_COACHING_TEXT,
      15000
    );
    const totalBytes = audioChunks.reduce((s, c) => s + c.length, 0);
    console.log(`  ✅ KR 음성 수신: ${audioChunks.length}청크, ${totalBytes}B, ${latencyMs}ms`);

    if (totalBytes > 0) {
      const wav = pcmToWav(Buffer.concat(audioChunks));
      writeFileSync(join(OUTPUT_DIR, '_step2_kr_test.wav'), wav);
    }
    results.step2_kr = { success: true, chunks: audioChunks.length, bytes: totalBytes, latencyMs };
  } catch (err) {
    console.log(`  ❌ KR 실패: ${err.message}`);
    results.step2_kr = { success: false, error: err.message };
  }

  // 일본어
  console.log('\n  [JP] 일본어 코칭 테스트:');
  try {
    const { audioChunks, latencyMs } = await collectAudioFromLive(
      ai, 'Kore',
      JP_SYSTEM,
      JP_COACHING_TEXT,
      15000
    );
    const totalBytes = audioChunks.reduce((s, c) => s + c.length, 0);
    console.log(`  ✅ JP 음성 수신: ${audioChunks.length}청크, ${totalBytes}B, ${latencyMs}ms`);

    if (totalBytes > 0) {
      const wav = pcmToWav(Buffer.concat(audioChunks));
      writeFileSync(join(OUTPUT_DIR, '_step2_jp_test.wav'), wav);
    }
    results.step2_jp = { success: true, chunks: audioChunks.length, bytes: totalBytes, latencyMs };
  } catch (err) {
    console.log(`  ❌ JP 실패: ${err.message}`);
    results.step2_jp = { success: false, error: err.message };
  }

  // ─── Step 3: 3보이스 시연 ───
  console.log('\n=== Step 3: 보이스 시연 (3종) ===\n');

  for (const voice of VOICES) {
    console.log(`  [${voice.name}] ${voice.desc}:`);
    try {
      const { audioChunks, latencyMs } = await collectAudioFromLive(
        ai, voice.name,
        KR_SYSTEM,
        KR_COACHING_TEXT,
        15000
      );
      const totalBytes = audioChunks.reduce((s, c) => s + c.length, 0);

      if (totalBytes > 0) {
        const wav = pcmToWav(Buffer.concat(audioChunks));
        const fileName = `${voice.name.toLowerCase()}_coaching_sample.wav`;
        const filePath = join(OUTPUT_DIR, fileName);
        writeFileSync(filePath, wav);
        console.log(`  ✅ ${fileName} (${wav.length}B, ${latencyMs}ms)`);
        results.step3[voice.name] = { success: true, file: fileName, bytes: wav.length, latencyMs };
      } else {
        console.log(`  ⚠️ 오디오 없음 (${audioChunks.length}청크, 0B)`);
        results.step3[voice.name] = { success: false, error: '오디오 데이터 없음' };
      }
    } catch (err) {
      console.log(`  ❌ ${voice.name} 실패: ${err.message}`);
      results.step3[voice.name] = { success: false, error: err.message };
    }
    console.log('');
  }

  // ─── Step 4: 이미지 입력 + AUDIO 응답 통합 테스트 ───
  console.log('=== Step 4: 이미지 + AUDIO 통합 테스트 ===\n');

  // 1x1 최소 JPEG 생성 (테스트용)
  // 또는 실제 이미지가 있으면 사용
  let testImageBase64;
  const sampleImagePath = join(OUTPUT_DIR, '_test_input.jpg');
  if (existsSync(sampleImagePath)) {
    testImageBase64 = readFileSync(sampleImagePath).toString('base64');
    console.log('  테스트 이미지: _test_input.jpg 사용');
  } else {
    // 최소한의 유효한 JPEG (8x8 흰색)
    // 실제 얼굴 사진이 아니므로 코칭 내용은 의미 없지만, 오디오 응답 확인 목적
    const { createCanvas } = await import('canvas').catch(() => ({ createCanvas: null }));
    if (createCanvas) {
      const canvas = createCanvas(64, 64);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(32, 28, 12, 0, Math.PI * 2);
      ctx.fill();
      testImageBase64 = canvas.toBuffer('image/jpeg').toString('base64');
      console.log('  테스트 이미지: canvas 생성 (64x64)');
    } else {
      // canvas 모듈 없으면 텍스트로 대체
      console.log('  ⚠️ canvas 모듈 미설치 — 이미지 대신 텍스트 입력으로 대체');
      try {
        const { audioChunks, latencyMs } = await collectAudioFromLive(
          ai, 'Kore',
          `몽코스 AI 코치입니다. 한국어로 응답하세요.
사용자가 촬영한 증명사진을 분석해주세요.
한국어 1문장, 15자 이내로 코칭해주세요.`,
          '사진을 보내겠습니다. 제 자세를 봐주세요.',
          15000
        );
        const totalBytes = audioChunks.reduce((s, c) => s + c.length, 0);
        console.log(`  ✅ 텍스트 대체 테스트: ${audioChunks.length}청크, ${totalBytes}B, ${latencyMs}ms`);
        results.step4 = { success: true, mode: 'text-fallback', chunks: audioChunks.length, bytes: totalBytes, latencyMs };
      } catch (err) {
        console.log(`  ❌ 텍스트 대체 실패: ${err.message}`);
        results.step4 = { success: false, error: err.message };
      }
      printSummary(results);
      return;
    }
  }

  const coachingSystem = `몽코스 AI 코치입니다. 반드시 한국어로 응답하세요.
증명사진 촬영 코칭입니다.
[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일
3. 표정 (무표정 또는 자연스러운 미소)
[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적`;

  try {
    const { audioChunks, latencyMs } = await collectAudioFromImage(
      ai, 'Kore',
      coachingSystem,
      testImageBase64,
      20000
    );
    const totalBytes = audioChunks.reduce((s, c) => s + c.length, 0);
    console.log(`  ✅ 이미지+오디오: ${audioChunks.length}청크, ${totalBytes}B, 지연=${latencyMs}ms`);

    if (totalBytes > 0) {
      const wav = pcmToWav(Buffer.concat(audioChunks));
      writeFileSync(join(OUTPUT_DIR, '_step4_image_audio.wav'), wav);
    }
    results.step4 = { success: true, mode: 'image', chunks: audioChunks.length, bytes: totalBytes, latencyMs };
  } catch (err) {
    console.log(`  ❌ 이미지+오디오 실패: ${err.message}`);
    results.step4 = { success: false, error: err.message };
  }

  printSummary(results);
}

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('검증 결과 요약');
  console.log('='.repeat(60));

  const s1 = results.step1;
  console.log(`\n[Step 1] 모델 접근: ${s1?.success ? '✅ 성공' : '❌ 실패'}`);
  if (s1?.success) console.log(`  청크=${s1.chunks}, ${s1.bytes}B, ${s1.latencyMs}ms`);
  else if (s1?.error) console.log(`  ${s1.error}`);

  const s2kr = results.step2_kr;
  console.log(`\n[Step 2] 한국어: ${s2kr?.success ? '✅' : '❌'} ${s2kr?.success ? `${s2kr.bytes}B, ${s2kr.latencyMs}ms` : (s2kr?.error || 'N/A')}`);
  const s2jp = results.step2_jp;
  console.log(`[Step 2] 일본어: ${s2jp?.success ? '✅' : '❌'} ${s2jp?.success ? `${s2jp.bytes}B, ${s2jp.latencyMs}ms` : (s2jp?.error || 'N/A')}`);

  console.log(`\n[Step 3] 보이스 시연:`);
  for (const voice of VOICES) {
    const r = results.step3[voice.name];
    if (r?.success) console.log(`  ${voice.name}: ✅ ${r.file} (${r.bytes}B, ${r.latencyMs}ms)`);
    else console.log(`  ${voice.name}: ❌ ${r?.error || 'N/A'}`);
  }

  const s4 = results.step4;
  console.log(`\n[Step 4] 이미지+오디오: ${s4?.success ? '✅' : '❌'} ${s4?.success ? `${s4.mode}, ${s4.bytes}B, ${s4.latencyMs}ms` : (s4?.error || 'N/A')}`);

  console.log('\n' + '='.repeat(60));

  // JSON 결과 저장
  const jsonPath = join(OUTPUT_DIR, '_test_results.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`결과 JSON: ${jsonPath}`);
}

main().catch(err => {
  console.error('치명적 에러:', err);
  process.exit(1);
});
