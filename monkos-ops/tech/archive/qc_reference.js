/**
 * QC (Quality Check) 레퍼런스 컴포넌트
 *
 * 비활성화 사유: Gemini 비전 QC가 프롬프트 예시값을 앵무새처럼 반복 (85% 고정값)
 *               실질적 검수 불가 판정 → 코드에서 제거
 * 제거일: 2026-03-09
 * 제거 전 상태: KR/JP result.js에서 주석 처리, Portal/KR/JP server에 라우트 존재(미호출)
 *
 * 재활성화 시 참고사항:
 * - gender 매핑: v5 프론트엔드는 'm'/'f' 전송 → QC는 'male'/'female' 기대 → 변환 필요
 * - ageMap: v5에 'baby' 옵션 존재하나 QC에 미정의 → 'baby: 영아' 추가 필요
 * - 응답 JSON 12필드 중 프론트엔드 사용 필드는 4개(identity, similarity, quality, note)
 *   → 프롬프트 간소화(사용 필드만 요청) 검토 → 앵무새 문제 완화 가능
 * - 프롬프트 3중 분산(Portal/KR/JP) 구조였음 → 재설계 시 단일 소스 권장
 *
 * 포함 코드:
 * 1. buildQCInstruction() — KR 버전 (Portal/KR 공용)
 * 2. buildQCInstruction() — JP 버전
 * 3. /api/qc 라우트 — KR Cloud Run (Express)
 * 4. handleQC() — Portal Cloud Run (http 직접)
 * 5. showQCBadge() — 프론트엔드 KR 버전
 * 6. showQCBadge() — 프론트엔드 JP 버전
 * 7. result.js QC 호출부 — KR 버전
 */

// ============================================================
// 1. buildQCInstruction — KR 버전 (Portal prompts.js / KR server.js 공용)
// ============================================================
function buildQCInstruction_KR(gender, age) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const ageMap = { child: '유아~12세', teen: '13~18세', adult: '19세 이상' };
  const ageText = ageMap[age] || '미지정';

  return `2개의 이미지를 비교하고, 2번째 이미지(증명사진)의 품질을 종합 분석해 주세요.
1번째: 원본 (실제 촬영)
2번째: AI 생성물 (증명사진)
사용자 설정: 성별=${genderText}, 연령대=${ageText}

[판정 기준 — 모두 체크 필수]
1. 동일 인물인가? (얼굴 구조, 눈/코/입 비율)
2. 유사도 % (0-100)
3. 아이덴티티 유지 (PASS/FAIL)
4. 성별 일치: 원본 인물의 외형 성별과 생성물이 일치하는가? (설정과 무관하게 원본 기준 판단)
5. 연령대 일치: 원본 인물의 외형 나이대와 생성물이 일치하는가? (아이→어른, 어른→아이 변환 감지)
6. 과도한 보정: 헤어스타일 대폭 변경, 피부 과보정, 얼굴 윤곽 변형, 눈크기 변경 등 부자연스러운 변형이 있는가?
7. 증명사진 품질 (조명, 배경, 구도)
8. 2번째 이미지에서 얼굴의 bounding box 좌표 [ymin, xmin, ymax, xmax] (0-1000 정규화)

[FAIL 조건 — 하나라도 해당되면 identity를 FAIL로 판정]
- 성별 외형이 원본과 다르게 변환됨
- 연령대가 원본과 크게 달라짐 (10세 이상 차이 추정)
- 얼굴 윤곽, 눈크기, 코 형태 등이 원본과 다르게 변형됨
- 헤어스타일이 원본과 완전히 다름 (정돈 수준은 허용)
- similarity 70% 미만

[응답 형식 — JSON만 출력]
{
  "same_person": true,
  "similarity": 85,
  "identity": "PASS",
  "gender_match": true,
  "age_match": true,
  "over_retouched": false,
  "quality": "GOOD",
  "face_box": [180, 220, 650, 780],
  "face_ratio": 0.35,
  "face_center_x": 500,
  "head_top_margin": 80,
  "note": "한줄 코멘트"
}

face_ratio = 얼굴 높이 / 전체 이미지 높이 (0.25~0.45 적합)
face_center_x = 얼굴 중심 x좌표 (500 근처면 중앙 정렬, ±50 허용)
head_top_margin = 머리 정수리에서 이미지 상단까지 여백 (40~150 적합)`;
}

// ============================================================
// 2. buildQCInstruction — JP 버전 (JP server.js)
// ============================================================
function buildQCInstruction_JP(gender, age) {
  const genderText = gender === 'male' ? '男性' : '女性';
  const ageMap = { child: '幼児〜12歳', teen: '13〜18歳', adult: '19歳以上' };
  const ageText = ageMap[age] || '未指定';

  return `2つの画像を比較し、2枚目（証明写真）の品質を総合分析してください。
1枚目：原本（実際の撮影）
2枚目：AI生成物（証明写真）
ユーザー設定：性別=${genderText}、年齢層=${ageText}

[判定基準 — すべてチェック必須]
1. 同一人物か？（顔の構造、目/鼻/口の比率）
2. 類似度 %（0-100）
3. アイデンティティ維持（PASS/FAIL）
4. 性別一致：原本人物の外見性別と生成物が一致するか？（設定に関わらず原本基準で判断）
5. 年齢層一致：原本人物の外見年齢と生成物が一致するか？（子供→大人、大人→子供の変換を検知）
6. 過度な補正：ヘアスタイル大幅変更、肌の過補正、顔の輪郭変形、目のサイズ変更等の不自然な変形があるか？
7. 証明写真品質（照明、背景、構図）
8. 2枚目の画像における顔のbounding box座標 [ymin, xmin, ymax, xmax]（0-1000正規化）

[FAIL条件 — 1つでも該当すればidentityをFAILと判定]
- 性別外見が原本と異なるように変換された
- 年齢層が原本と大きく異なる（10歳以上の差と推定）
- 顔の輪郭、目のサイズ、鼻の形態等が原本と異なるように変形された
- ヘアスタイルが原本と完全に異なる（整える程度は許容）
- similarity 70%未満

[応答形式 — JSONのみ出力]
{
  "same_person": true,
  "similarity": 85,
  "identity": "PASS",
  "gender_match": true,
  "age_match": true,
  "over_retouched": false,
  "quality": "GOOD",
  "face_box": [180, 220, 650, 780],
  "face_ratio": 0.35,
  "face_center_x": 500,
  "head_top_margin": 80,
  "note": "一行コメント"
}

face_ratio = 顔の高さ / 画像全体の高さ（0.25〜0.45が適切）
face_center_x = 顔の中心x座標（500付近なら中央揃え、±50許容）
head_top_margin = 頭頂部から画像上端までの余白（40〜150が適切）`;
}

// ============================================================
// 3. /api/qc 라우트 — KR Cloud Run (Express, idphoto-kr/server.js)
// ============================================================
// const QC_MODELS = ['gemini-3-flash-preview', 'gemini-2.0-flash'];
//
// app.post('/api/qc', async (req, res) => {
//   try {
//     const { original, generated, gender = 'male', age = 'adult' } = req.body;
//     if (!original || !generated) {
//       return res.status(400).json({ error: '원본과 생성 이미지 모두 필요합니다' });
//     }
//     const origBase64 = original.includes(',') ? original.split(',')[1] : original;
//     const genBase64 = generated.includes(',') ? generated.split(',')[1] : generated;
//     const instruction = buildQCInstruction(gender, age);
//     for (const model of QC_MODELS) {
//       try {
//         const response = await ai.models.generateContent({
//           model,
//           contents: [{ role: 'user', parts: [
//             { inlineData: { mimeType: 'image/png', data: origBase64 } },
//             { inlineData: { mimeType: 'image/png', data: genBase64 } },
//             { text: instruction },
//           ]}],
//           config: { responseMimeType: 'application/json', temperature: 0.3 },
//         });
//         const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
//         try {
//           const jsonMatch = text.match(/\{[\s\S]*\}/);
//           if (jsonMatch) return res.json(JSON.parse(jsonMatch[0]));
//         } catch { /* JSON 파싱 실패 → 다음 모델 */ }
//         return res.json({ raw: text });
//       } catch (err) {
//         if (model === QC_MODELS[QC_MODELS.length - 1]) {
//           return res.json({ identity: 'ERROR', note: `QC 전체 실패: ${err.message}` });
//         }
//       }
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// ============================================================
// 4. handleQC — Portal Cloud Run (portal/lib/coaching.js)
// ============================================================
// export async function handleQC(req, res) {
//   try {
//     const { original, generated, gender = 'male', age = 'adult', style } = await parseJsonBody(req);
//     if (!original || !generated) {
//       res.writeHead(400, { 'Content-Type': 'application/json' });
//       res.end(JSON.stringify({ error: 'original, generated 필수' }));
//       return;
//     }
//     const origBase64 = original.includes(',') ? original.split(',')[1] : original;
//     const genBase64 = generated.includes(',') ? generated.split(',')[1] : generated;
//     const qcPrompt = buildQCInstruction(gender, age);
//     const text = await chatWithMonkos('qc', 'qc', 'QC 판정해주세요.', {
//       image: origBase64, image2: genBase64, systemPromptOverride: qcPrompt,
//     });
//     try {
//       const result = JSON.parse(text);
//       res.writeHead(200, { 'Content-Type': 'application/json' });
//       res.end(JSON.stringify(result));
//     } catch {
//       res.writeHead(200, { 'Content-Type': 'application/json' });
//       res.end(JSON.stringify({ identity: 'ERROR', raw: text }));
//     }
//   } catch (err) {
//     res.writeHead(500, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({ error: err.message }));
//   }
// }

// ============================================================
// 5. showQCBadge — 프론트엔드 KR (idphoto-kr/public/result.js)
// ============================================================
// function showQCBadge(result) {
//   const badge = document.getElementById('qc-badge');
//   if (!badge) return;
//   if (!result) { badge.style.display = 'none'; return; }
//   badge.style.display = 'block';
//   const similarity = result.similarity || 0;
//   const passed = result.identity === 'PASS' && similarity >= 70;
//   if (passed) {
//     badge.className = 'qc-badge pass';
//     badge.innerHTML = `<span>AI 검수 완료</span> · 유사도 ${similarity}% · ${result.quality || '양호'}`;
//   } else if (result.identity === 'ERROR') {
//     badge.className = 'qc-badge pending';
//     badge.textContent = 'AI 검수: 분석 실패 (결과에 영향 없음)';
//   } else {
//     badge.className = 'qc-badge fail';
//     badge.innerHTML = `<span>AI 검수 주의</span> · 유사도 ${similarity}% · ${result.note || '재촬영 권장'}`;
//   }
// }

// ============================================================
// 6. showQCBadge — 프론트엔드 JP (idphoto-jp/public/result.js)
// ============================================================
// function showQCBadge(result) {
//   const badge = document.getElementById('qc-badge');
//   if (!badge) return;
//   if (!result) { badge.style.display = 'none'; return; }
//   badge.style.display = 'block';
//   const similarity = result.similarity || 0;
//   const passed = result.identity === 'PASS' && similarity >= 70;
//   if (passed) {
//     badge.className = 'qc-badge pass';
//     badge.innerHTML = `<span>AI検査完了</span> · 類似度 ${similarity}% · ${result.quality || '良好'}`;
//   } else if (result.identity === 'ERROR') {
//     badge.className = 'qc-badge pending';
//     badge.textContent = 'AI検査：分析失敗（結果に影響なし）';
//   } else {
//     badge.className = 'qc-badge fail';
//     badge.innerHTML = `<span>AI検査注意</span> · 類似度 ${similarity}% · ${result.note || '再撮影推奨'}`;
//   }
// }

// ============================================================
// 7. result.js QC 호출부 — KR 버전 (idphoto-kr/public/result.js)
// ============================================================
// // 생성 완료 직후:
// let qcResult = null;
// const qcPromise = pipe.run('qc', {
//   original: base64,
//   generated: genResult.image,
//   gender: store.gender === 'f' ? 'female' : 'male',
//   age: store.age || 'adult',
// }).then(r => { qcResult = r; })
//   .catch(e => Monk.log('QC 에러: ' + (e.error || e.message)));
//
// // 10초 타임아웃 대기:
// await Promise.race([qcPromise, new Promise(r => setTimeout(r, 10000))]);
//
// // 결과 배지 표시:
// showQCBadge(qcResult);
