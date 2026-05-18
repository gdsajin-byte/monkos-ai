---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 대기
---

# [지시서] monkos-ai 레포 README 업데이트 + Crop Dev Log 이슈 게시 (수위 조절)

> **[2026-03-18 13:19 KST] iMac/쌍아 → iMac/막내**
> **[2026-03-18 13:40 KST] 수정** — 특허 출원 전 공개 수위 조절. 핵심 연산/구간 수치 제거.
> GitHub `gdsajin-byte/monkos-ai` 레포의 README 업데이트 + 크롭앱 Dev Log 이슈 게시

---

## ⚠️ 특허 공개 수위 제한 (최우선 준수)

특허/실용신안 출원 전이므로 아래 내용은 **절대 포함 금지**:

### 금지 항목
1. **정수리 추산 공식** — `crownY = eyeY - (chinY - eyeY)` 등 구체적 연산 코드
2. **판정 구간 수치** — 33~35mm(녹색), 32~33mm(노랑) 등 구체적 구간값
3. **FaceMesh 랜드마크 인덱스** — #159, #386, #152 등 구체적 번호
4. **Canvas 크롭 파이프라인 코드** — ctx.translate, ctx.scale 등 재현 가능 코드
5. **SPECS 객체 상세** — faceMin/faceMax/faceTarget 등 내부 수치
6. **autoPlace 알고리즘 단계별 설명** — 구체적 순서/로직

### 공개 허용 항목
- 아키텍처 진화 **스토리** (v0→v1→v2, 왜 전환했는지 설계 철학)
- "MediaPipe FaceMesh 사용", "Canvas 2D로 크롭" 수준의 기술 스택 언급
- "ICAO 규격 준수", "3단계 색상 판정" 수준의 기능 소개 (구간값 없이)
- "서버 비용 제로", "프라이버시 보호" 등 가치 제안
- 개발 메트릭스 (8일, 977 LOC 등)
- 경쟁사 비교표 (기능 수준)

---

## 1. README.md 업데이트

### 현재 상태
- `gdsajin-byte/monkos-ai` (PUBLIC)
- 기존 README: AI Photo Platform 소개, Identity Preservation, Anti-Deepfake, Features, Architecture, Compliance 등
- 크롭앱 관련 내용 **없음**

### 작업
기존 README 구조를 유지하면서 **MONKOS Crop 섹션을 추가**한다.

#### 추가 위치: `## Features` 아래, `## Architecture` 위

#### 포함할 내용 (수위 조절 버전)
- MONKOS Crop 소개 (1-2문장)
- 경쟁 비교표 (기능 수준만, 구현 디테일 없이)
- 아키텍처 진화 3단계 **스토리 요약** (각 1줄, 설계 철학 위주)
  - v0: LLM 좌표 추출 시도 → 픽셀 정밀도 한계 발견
  - v1: 서버 FaceMesh → 정밀도 해결, 서버 의존 문제 잔존
  - v2: 클라이언트 완결 → 서버 제거, 프라이버시 완전 보호
- 기술 스택 요약 (이름만, 사용 방법 없이)
- [monkos.ai/crop](https://monkos.ai/crop) 링크

#### 기존 섹션 보강
- `## Features`에 추가: `✂️ **Free Crop Tool** — ICAO-compliant passport crop, runs entirely in browser, zero server cost`
- `## Architecture`에 추가: `**Client-side Crop Engine** — Browser-based face detection + canvas crop (zero server)`
- `## Links`에 추가: `✂️ [Free Crop Tool](https://monkos.ai/crop) — Browser-based ICAO passport crop`

### 소스 참조
`monkos-ops/works/crop/README_MONKOS_CROP.md`를 참조하되, **⚠️ 금지 항목에 해당하는 내용은 모두 제거**하고 스토리/가치 제안 위주로 재구성.

### 실행 방법

```bash
# 현재 README 가져오기
gh api repos/gdsajin-byte/monkos-ai/readme --jq '.content' | base64 -d > /tmp/readme_current.md

# 수정 후 push
gh api repos/gdsajin-byte/monkos-ai/contents/README.md \
  -X PUT \
  -f message="[docs] Add MONKOS Crop section — client-side ICAO passport crop" \
  -f content="$(base64 < /tmp/readme_updated.md)" \
  -f sha="$(gh api repos/gdsajin-byte/monkos-ai/readme --jq '.sha')"
```

---

## 2. Issue 게시 — Crop Dev Log (수위 조절)

### 소스 참조
`monkos-ops/works/crop/ISSUE_MONKOS_CROP_devlog.md`를 참조하되, **⚠️ 금지 항목 제거** 후 게시.

### 구체적 제거 대상
- "crown estimation" 공식 코드
- tfjs 백엔드 테이블 (삽질기 스토리는 OK, 구체 에러명은 제거)
- "3-tier color judgment" 구간 수치
- Canvas transform replication 코드
- "Fun tfjs finding" 중 구체적 에러명/백엔드명

### 유지할 내용
- TL;DR
- 문제 정의
- 3번의 아키텍처 피벗 **스토리** (왜 바꿨는지)
- "서버 제거 → 비용 제로 + 프라이버시" 가치
- 개발 숫자 (977 LOC, 8일, 1 dependency 등)
- iOS Safari 다운로드 문제 (일반적 웹 개발 팁)
- 로드맵 (Tier 2/3)

### 실행 방법

```bash
# 수위 조절된 내용으로 직접 작성
gh issue create -R gdsajin-byte/monkos-ai \
  --title "[Dev Log] MONKOS Crop — Client-side ICAO passport crop in 8 days, 3 architecture pivots" \
  --body "$(cat /tmp/issue_crop_adjusted.md)"
```

---

## 3. 주의 사항

- ⚠️ **특허 수위 제한 최우선** — 금지 항목 포함 시 반려. 게시 전 자체 점검 필수
- ⚠️ **내부 호칭 금지** (헌법 제3조 2항)
- ⚠️ 기존 README 구조/톤 유지 — 새 섹션 추가만, 기존 내용 삭제/변경 금지
- ⚠️ 기존 Issue #1 (Multi-Agent Review) 건드리지 않음

---

## 4. 완료 보고

- README 업데이트 커밋 SHA
- Issue 번호 + URL
- **게시 전 금지 항목 미포함 자체 점검 결과** 포함
- 형식: `✅❌💡⏳📁🔀`
