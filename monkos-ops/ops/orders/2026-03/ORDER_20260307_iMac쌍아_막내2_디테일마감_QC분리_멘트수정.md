---
type: order
date: 2026-03-07
from: iMac/쌍아
to: iMac/막내2
status: pending
---

# [지시서] 디테일 마감 — QC 분리 + 스탠바이 멘트 수정 + 코칭 프롬프트 정비

> **[2026-03-07 12:20 KST] iMac/쌍아 → iMac/막내2**
>
> 작가님 디테일 마감 지시. QC 로직 분리(비활성화) + 스탠바이 체크리스트 멘트 수정 + 코칭 systemInstruction 포맷별 정비.

---

## Phase 1: QC 로직 비활성화 — result.js

**파일**: `monkos_AI/idphoto-kr/public/result.js`

### 현행 문제
- QC가 별도 Gemini 엔진(gemini-3-flash-preview)으로 호출되나, 프롬프트 예시에 `"similarity": 85`가 하드코딩되어 모델이 값을 그대로 따라감
- 결과적으로 항상 "일치율 85% GOOD" → 실질적 검수 기능 없음
- QC API 호출이 생성 완료 후 10초까지 블로킹 (UX 지연)

### 작업: QC 호출 + 배지 비활성화

`confirmAndGenerate()` 함수 내 QC 관련 코드를 비활성화. 삭제가 아닌 **주석 처리**:

```javascript
// 변경 전 (라인 256-264)
    // QC + 워터마크를 병렬 실행 (QC는 백그라운드, 실패해도 진행 차단 안 함)
    let qcResult = null;
    const qcPromise = pipe.run('qc', {
      original: base64,
      generated: genResult.image,
      gender: store.gender === 'f' ? 'female' : 'male',
      age: store.age || 'adult',
    }).then(r => { qcResult = r; Monk.log(`QC: ${JSON.stringify(r).substring(0, 100)}`); })
      .catch(e => Monk.log('QC 에러: ' + (e.error || e.message)));

// 변경 후
    // [QC 비활성화] 프롬프트 예시값 앵무새 문제로 실질적 검수 불가 — 별도 컴포넌트로 분리 후 재설계 예정
    let qcResult = null;
    // const qcPromise = pipe.run('qc', { ... });
```

QC 완료 대기도 비활성화:

```javascript
// 변경 전 (라인 283-284)
    // QC 완료 대기 (최대 10초)
    await Promise.race([qcPromise, new Promise(r => setTimeout(r, 10000))]);

// 변경 후
    // [QC 비활성화] QC 대기 제거
    // await Promise.race([qcPromise, new Promise(r => setTimeout(r, 10000))]);
```

QC 배지 호출도 비활성화:

```javascript
// 변경 전 (라인 314)
      // QC 결과 표시
      showQCBadge(qcResult);

// 변경 후
      // [QC 비활성화] 배지 미표시
      // showQCBadge(qcResult);
```

**`showQCBadge()` 함수 자체는 유지** (향후 재활성화 가능).

### result.html QC 배지 숨김

**파일**: `monkos_AI/idphoto-kr/public/result.html`

라인 197의 QC 배지 `display:none` 이미 적용되어 있으므로 **수정 불필요**. 확인만.

---

## Phase 2: 스탠바이 체크리스트 멘트 수정 — camera.html

**파일**: `monkos_AI/idphoto-kr/public/camera.html`

### 현행 문제
- "눈썹·이마가 보이도록 준비해주세요" → 이력서 사진에서는 부적절 (여권/신분증 전용 요구사항)
- 범용적 가이드가 필요

### 변경 (라인 175-188)

```html
<!-- 변경 전 -->
<div class="standby-checklist">
    <div class="checklist-item">
        <span class="checklist-icon">💡</span>
        <span>밝은 곳에서 촬영해주세요</span>
    </div>
    <div class="checklist-item">
        <span class="checklist-icon">👀</span>
        <span>눈썹·이마가 보이도록 준비해주세요</span>
    </div>
    <div class="checklist-item">
        <span class="checklist-icon">📷</span>
        <span>카메라와 약 50cm 거리를 유지하세요</span>
    </div>
</div>

<!-- 변경 후 -->
<div class="standby-checklist">
    <div class="checklist-item">
        <span class="checklist-icon">💡</span>
        <span>밝은 곳에서 촬영해주세요</span>
    </div>
    <div class="checklist-item">
        <span class="checklist-icon">👔</span>
        <span>헤어와 의상을 깔끔하게 정돈해주세요</span>
    </div>
    <div class="checklist-item">
        <span class="checklist-icon">📷</span>
        <span>카메라와 약 50cm 거리를 유지하세요</span>
    </div>
</div>
```

**핵심 변경:**
- "눈썹·이마가 보이도록" → "헤어와 의상을 깔끔하게 정돈해주세요" (모든 포맷 범용)
- 아이콘 👀 → 👔 (의상 정돈 맥락)
- 눈썹/이마 체크는 코칭 AI가 여권 포맷일 때만 실시간으로 지적 (systemInstruction에서 분기)

---

## Phase 3: 코칭 systemInstruction 포맷별 정비 — server.js

**파일**: `monkos_AI/idphoto-kr/server.js`

### 현행 문제
- `passport` 프롬프트: 체크순서 4번 "눈썹이 보이는지", 5번 "얼굴 라인이 드러나는지" → 여권에만 해당하는 체크. 맞음. **유지**.
- `id` 프롬프트: 눈썹/이마 체크가 아예 없음 → 맞음. 이력서는 자연스러운 미소가 핵심. **유지**.
- **수정 필요**: id 프롬프트에 "헤어와 의상 정돈" 체크 추가

### 변경 — `id` 프롬프트 (라인 139-162)

```javascript
// 변경 전
  id: `이력서 사진 촬영 AI 코치입니다.

[코칭 규칙]
- 한국어 1문장, 15자 이내
- 문제 시 1가지만 지적 (고개 각도, 표정, 조명 등)
- 좋은 상태면 "좋아요!" 또는 "완벽해요!"

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (자연스럽고 호감가는 미소)
4. 자세 (허리 펴고, 어깨 수평)

[세션 규율]
...동일...`,

// 변경 후
  id: `이력서 사진 촬영 AI 코치입니다.

[코칭 규칙]
- 한국어 1문장, 15자 이내
- 문제 시 1가지만 지적 (고개 각도, 표정, 조명 등)
- 좋은 상태면 "좋아요!" 또는 "완벽해요!"

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (자연스럽고 호감가는 미소)
4. 자세 (허리 펴고, 어깨 수평)
5. 헤어와 의상이 깔끔하게 정돈되었는지

[세션 규율]
...나머지 동일...`,
```

**[세션 규율] 이하 내용은 변경 없이 유지.**

---

## ⚠️ 준수 조항

- **헌법 2조**: Phase별 보고 필수
- **헌법 6조**: API 키 생성·추측 금지
- **법률 6장**: 커밋 메시지 `[fix] 디테일 마감 — QC 비활성화 + 스탠바이 멘트 수정 + 코칭 프롬프트 정비`

---

## 참조 코드

| 파일 | 구간 | 역할 |
|------|------|------|
| `monkos_AI/idphoto-kr/public/result.js` | 라인 256-264, 283-284, 314 | QC 호출·대기·배지 (비활성화 대상) |
| `monkos_AI/idphoto-kr/public/result.js` | 라인 332-357 | showQCBadge 함수 (유지, 호출만 비활성화) |
| `monkos_AI/idphoto-kr/public/result.html` | 라인 197 | QC 배지 HTML (확인만) |
| `monkos_AI/idphoto-kr/public/camera.html` | 라인 175-188 | 스탠바이 체크리스트 (멘트 수정) |
| `monkos_AI/idphoto-kr/server.js` | 라인 112-163 | COACHING_INSTRUCTIONS (id 프롬프트 수정) |
| `monkos_AI/idphoto-kr/server.js` | 라인 316-362 | buildQCInstruction (유지, 호출 안 됨) |
| `monkos_AI/idphoto-kr/server.js` | 라인 644-691 | /api/qc 엔드포인트 (유지, 호출 안 됨) |

---

## 보고서

- `monkos-ops/ops/reports/REPORT_20260307_막내2_디테일마감.md`
- Phase 1: QC 호출·대기·배지 비활성화 확인
- Phase 2: 스탠바이 멘트 변경 확인
- Phase 3: id 코칭 프롬프트 체크순서 5번 추가 확인
