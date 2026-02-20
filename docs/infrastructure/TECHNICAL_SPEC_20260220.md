# 기술명세: 2026-02-20 인프라 변경사항

**작성일**: 2026-02-20
**작성자**: M1/막내1 (지시서: M1/쌍아)

---

## 1. CF Pages 배포 체계 변경

### 변경 전
- GitHub 웹훅 자동빌드 (push → 자동 deploy)
- develop/main 브랜치 push 시 즉시 배포 트리거

### 변경 후
- 자동빌드 OFF, **수동 배포만** (`wrangler pages deploy`)
- 변경 이유: 멀티 에이전트 환경에서 push = 배포 통제 불가

### Production 배포 명령 (2/20 오후 정정)
```bash
npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true
```
- 프로젝트 루트에서 직접 실행 (symlink/tmp 우회 폐기)
- wrangler는 CWD의 `functions/`를 참조 → `/tmp` 우회 시 Functions 누락

### 환경 매핑
| 옵션 | 환경 | 도메인 |
|------|------|--------|
| `--branch main` | Production | monk.kr |
| 미지정 / 기타 | Preview | *.monk-kr.pages.dev |

---

## 2. photolab MPA 현재 상태

### 페이지 구조 (6페이지)
```
index.html   → 랜딩 (가격표 + 시작 버튼)
prep.html    → 준비실 (스타일·성별·연령 선택)
camera.html  → 촬영실 (카메라 + AI 코칭)
result.html  → 분석실 (사전분석 → 생성 → 결과)
thankyou.html → 수령처 (미리보기 + 저장 + SNS 공유)
options.html → 옵션 (추가 촬영 / 이벤트 / 포털 복귀)
```

### QC 파이프라인 변경
- **제거됨**: QC(품질검증) 단계
- **현재 흐름**: 사전분석 → Imagen 생성 → 바로 결과 표시
- 제거 이유: 79 임계점 — QC가 Cloud Run 리소스 잠식의 주범

### 크레딧 단가
| 항목 | 크레딧 | 원화 |
|------|--------|------|
| 생성 | 1c | ₩1,500 |
| 다운로드 | 8c | ₩12,000 |
| **합계** | **9c** | **₩13,500** |

### 관련 커밋
- `b02930b` — photolab MPA 구조 완성 (랜딩 분리 + QC 제거 + 크레딧 통일)
- `cc628a0` — 랜딩 가격 카드화 + 크레딧 단가 정정

---

## 3. 경로 공백 제거 완료

### 문제
```
/Users/developer/monk_project/   ← 후행 공백 (mv 시점 불명, Finder/자동화 추정)
```

### 해결
```bash
mv "/Users/developer/monk_project " "/Users/developer/monk_project"
```

### 기능성 파일 수정 (하드코딩 경로 포함)
| 파일 | 수정 내용 |
|------|-----------|
| `scripts/sync_visitors_to_gcs.sh` | 경로 공백 제거 |
| `scripts/sync_to_gcs.sh` | 경로 공백 제거 |
| `package-lock.json` | 자동 생성 경로 반영 |

### 사후 조치
- Claude projects dir: 새 경로에서 자연 생성 확인 → 구 dir(`-monk-project-`) 삭제
- symlink `/tmp/monk-kr-deploy`: 새 경로로 재생성
- 관련 커밋: `2fc1afb`, `dd71a75`

---

## 4. CLAUDE.md 체계화 (완료)

- 헌법(CLAUDE.md 핵심) / 법률(별도 `laws/` 8장) 분리 완료
- 373줄 → 137줄 압축

---

## 5. functions/ 정본 구조 정상화

### 문제
- `functions/` (symlink) → `MONK_kr/functions/` (실체) 이중 구조
- wrangler가 symlink 미추적 → 빌드 시 `.wrangler/tmp` 경로 오류
- `/tmp` 우회 배포 시 CWD에 `functions/` 없음 → **Functions 전멸 (모든 API 405)**

### 해결
```bash
# symlink 제거, 실체 디렉토리로 교체
mv functions functions_symlink_backup
cp -r MONK_kr/functions/ functions/
```

### 정본 구조 (확정)
```
monk_project/
├── functions/          ← 정본 (실제 디렉토리, wrangler가 참조)
│   └── api/
│       ├── generate.js    — Imagen 4 T2I
│       ├── refine.js      — NB3 I2I/Edit/Upscale
│       ├── analyze.js     — Gemini Flash 이미지 분석
│       ├── photo.js       — NB3 I2I (증명사진)
│       ├── idgen.js       — NB3 I2I (증명사진 생성)
│       ├── precheck.js    — Gemini Flash 사전분석
│       ├── qc.js          — Gemini Flash QC
│       └── ... (auth, payment, telegram 등)
└── MONK_kr/            ← 정적 에셋만 (functions/ 없음)
```

### 관련 커밋
- `46cd14d` — functions/ 정본 구조 정상화

---

## 6. image_pro 모델 정상화 (Google API 변경 대응)

### 배경
- monk.kr/ai_lab/image_pro 전체 API 장애 (2026-02-19~20)
- 원인 1: functions/ 배포 누락 (§5에서 해결)
- 원인 2: Google이 모델/엔드포인트를 변경 → 기존 코드 파괴

### Google API 변경 내역

| 파일 | 변경 전 (장애) | 변경 후 (복구) | 변경 유형 |
|------|---------------|---------------|-----------|
| `generate.js` | `imagen-4.0-generate-001:generateImages` | `imagen-4.0-generate-001:predict` | 엔드포인트 변경 |
| `generate.js` | `{ prompt, config: { numberOfImages } }` | `{ instances: [{ prompt }], parameters: { sampleCount } }` | 요청 구조 변경 |
| `generate.js` | `generatedImages[].image.imageBytes` | `predictions[].bytesBase64Encoded` | 응답 구조 변경 |
| `analyze.js` | `gemini-2.0-flash-exp` | `gemini-2.0-flash` | 모델 폐기 |
| `refine.js` | `gemini-2.0-flash-exp` + `responseModalities` | `gemini-3-pro-image-preview` (NB3) | 모델 교체 + 설정 제거 |

### Imagen 4 `:predict` 엔드포인트 상세

```javascript
// 엔드포인트
`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`

// 요청 (Vertex AI 스타일)
{
  instances: [{ prompt: "..." }],
  parameters: {
    sampleCount: 4,
    aspectRatio: "1:1",
    safetyFilterLevel: "block_low_and_above",
    personGeneration: "allow_adult"
  }
}

// 응답
{
  predictions: [
    { bytesBase64Encoded: "BASE64...", mimeType: "image/png" }
  ]
}
```

### NB3 I2I (refine.js) 정본 패턴

```javascript
// photo.js 패턴 준수 (증명사진 I2I와 동일)
`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`

// 요청: contents + inlineData (responseModalities 사용 금지)
// 응답: candidates[0].content.parts.find(p => p.inlineData).inlineData.data
```

### API 인증 통일

| 방식 | 적용 | 비고 |
|------|------|------|
| Query param `?key=` | generate, refine | `:predict` / NB3 정본 패턴 |
| Header `x-goog-api-key` | analyze | Flash 텍스트 분석 |
| CF Pages Secret | 전체 | `env.GEMINI_API_KEY` |

### Google 모델 변경 패턴 (교훈)

```
Phase 1: Vertex AI ADC 무료 개방 → 개발자 유입
Phase 2: 모델명/엔드포인트 변경 (기존 코드 파괴)
Phase 3: API Key 종량제 전용 이전 (Google AI Studio)
Phase 4: Vertex AI에는 구 버전만 잔류
```

- **대응 원칙**: 장애 발생 시 Google AI Studio에서 현재 동작 모델명/엔드포인트 확인 → 코드 갱신
- **금지**: 폐기 모델을 다른 모델로 조용히 교체 (원인 보고 없는 우회 금지 — 헌법 제10조)

### 가동 확인 (2026-02-20 13:20 KST)

| API | 모델 | 상태 |
|-----|------|------|
| `/api/generate` | Imagen 4 (`:predict`) | ✅ T2I 정상 |
| `/api/refine` | NB3 (`gemini-3-pro-image-preview`) | ✅ I2I 정상 |
| `/api/analyze` | Flash (`gemini-2.0-flash`) | ✅ 분석 정상 |
| `/api/photo` | NB3 | ✅ 기존 정상 |
| `/api/idgen` | NB3 | ✅ 기존 정상 |
| `/api/precheck` | Flash | ✅ 기존 정상 |
| `/api/qc` | Flash | ✅ 기존 정상 |

### 관련 커밋
- `4dad3c7` — analyze/refine 폐기 모델 교체
- `8590a08` — generate.js 엔드포인트 :generateImages → :predict
- `dd458d6` — generate.js 응답 파싱 predictions[].bytesBase64Encoded

### Git 설정 정정
- iMac git config 미설정 → 호스트명 자동 생성값 사용 (`Jeong-Kyu Shin`)
- 정정: `gdsajin-byte <gdsajin@gmail.com>` (글로벌 설정 완료)
