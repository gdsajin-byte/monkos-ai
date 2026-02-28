// CF Workers — QC 검증 (Gemini Flash 직접 호출)
// 프록시 제거, 자체 엔진. idphoto-kr/server.js buildQCInstruction 전문 복사

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// QC 프롬프트 (idphoto-kr/server.js L214~260 전문)
function buildQCInstruction(gender, age) {
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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API 키 미설정' }), { status: 500, headers: CORS });
    }

    const body = await request.json();
    const { original, generated, gender = 'male', age = 'adult' } = body;

    if (!original || !generated) {
      return new Response(JSON.stringify({ error: '원본과 생성 이미지 모두 필요합니다' }), { status: 400, headers: CORS });
    }

    // data: prefix 제거
    const origBase64 = original.includes(',') ? original.split(',')[1] : original;
    const genBase64 = generated.includes(',') ? generated.split(',')[1] : generated;

    const qcPrompt = buildQCInstruction(gender, age);

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { data: origBase64, mimeType: 'image/png' } },
              { inlineData: { data: genBase64, mimeType: 'image/png' } },
              { text: qcPrompt },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API 오류:', errorText);
      throw new Error(`API 오류: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);

    if (!textPart?.text) {
      throw new Error('QC 분석 결과 없음');
    }

    let result;
    try {
      result = JSON.parse(textPart.text);
    } catch {
      result = { identity: 'ERROR', note: 'QC 분석 파싱 실패' };
    }

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    console.error('qc 오류:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
