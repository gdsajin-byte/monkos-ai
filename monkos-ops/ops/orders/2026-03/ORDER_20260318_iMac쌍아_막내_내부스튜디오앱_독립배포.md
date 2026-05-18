---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 완료
---

# [지시서] 내부 스튜디오 앱 — idphoto-kr 기반 독립 배포

> **[2026-03-18 15:46 KST] iMac/쌍아 → iMac/막내**
> 증명앱(idphoto-kr)을 복사하여 내부용 스튜디오 앱으로 독립 배포.
> 촬영실 → 파일 업로드 입력으로 교체. 나머지 파이프라인 그대로.

---

## 목적

1. **즉시**: 마케팅용 Before/After 비교 컷 대량 생산
2. **중기**: 프로필 앱 프로토타입 (의상 세분화, 프롬프트 세밀화)
3. **장기**: AI 보정 파이프라인 스트레스 테스트 + 실험 환경

---

## Phase 1: 기본 구축

### 1-1. 폴더 구조

```
monkos_AI/studio/          ← 신규 폴더 (idphoto-kr 복사 기반)
├── server.js              ← idphoto-kr/server.js 복사 + 수정
├── public/
│   ├── app.html           ← 촬영실 → 파일 업로드로 교체
│   ├── app.js             ← 카메라 로직 → 파일 입력 로직으로 교체
│   ├── result.html        ← 그대로 + Before/After 비교 뷰 추가
│   ├── result.js          ← 그대로 + 비교 컷 생성 로직 추가
│   ├── style.css          ← 그대로 (+ 비교 뷰 스타일)
│   └── ...                ← 나머지 정적 파일 그대로
├── lib/
│   ├── photo.js           ← 그대로 (AI 보정 파이프라인 정본)
│   ├── gcs-save.js        ← 그대로
│   └── ...
├── Dockerfile             ← 복사 + 서비스명만 변경
└── deploy.sh              ← 복사 + Cloud Run 서비스명 변경
```

### 1-2. 복사 대상

```bash
cp -r monkos_AI/idphoto-kr monkos_AI/studio
```

### 1-3. 변경 사항 (최소)

#### A. app.html — 촬영실 → 파일 업로드

**제거:**
- 카메라 스트림 UI (video 태그, 셔터 버튼, 카운트다운)
- 촬영 가이드 오버레이
- 카메라 권한 요청 로직

**추가:**
- `<input type="file" accept="image/*">` + 드래그앤드롭 영역
- 이미지 미리보기 (업로드 후 즉시 표시)
- "AI 보정 시작" 버튼 (기존 촬영 후 자동 진행 → 수동 트리거로 변경)

**유지:**
- 규격 선택 (여권/반명함)
- 전체 디자인/퍼널 흐름
- 프로그레스 UI

#### B. app.js — 카메라 → 파일 입력

**제거:**
- `navigator.mediaDevices.getUserMedia()` 카메라 접근
- 셔터/타이머 로직
- 촬영 가이드 포지셔닝

**추가:**
- `FileReader` + `canvas` 미리보기
- 파일 → Base64 변환 → 기존 파이프라인 투입
- 드래그앤드롭 핸들러

**유지:**
- API 호출 로직 (`/api/generate`)
- 프로그레스 업데이트
- 결과 페이지 전환

#### C. result.html/js — Before/After 비교 추가

**추가:**
- 원본 이미지 나란히 표시 (좌: Before, 우: After)
- "비교 컷 다운로드" 버튼 — Canvas로 원본+결과를 나란히 합성 → JPEG 다운로드
- 비교 컷 레이아웃: 2컬럼 (원본 | 결과) + 하단에 MONKOS 로고

**유지:**
- 기존 결과 표시 UI
- 다운로드 버튼
- 크롭앱 연결

#### D. server.js — 인증/결제 바이패스

**제거 또는 바이패스:**
- Google 로그인 체크
- 크레딧 차감 로직
- 결제 관련 API 엔드포인트

**유지:**
- `/api/generate` (photo.js 호출)
- `/api/qc` (QC 검증)
- GCS 저장 (내부 샘플 보관용)

#### E. Dockerfile / deploy.sh

- Cloud Run 서비스명: `monkos-studio` (기존: `idphoto-kr`)
- 리전: `asia-northeast3` (동일)
- 환경변수: 기존 `.env` 공유 (동일 GCP 프로젝트)

---

## Phase 2 (후속 — 이번 지시서 범위 외)

- 프롬프트 입력 필드 추가 (photo.js 프롬프트 오버라이드)
- 의상/배경/조명 옵션 UI
- 배치 처리 (여러 이미지 한번에)
- 결과 히스토리 (GCS 저장된 샘플 갤러리)

---

## ⚠️ 준수 조항

- 헌법 제4조: API 키 하드코딩 금지. 기존 환경변수 참조
- 헌법 제3조: 내부용이지만 외부 노출 방지 — robots.txt Disallow, 인덱싱 차단
- **idphoto-kr 원본 수정 금지** — 복사본(studio/)만 수정
- **photo.js 수정 금지** — AI 파이프라인은 정본 그대로 사용

---

## 검증

- [ ] 이미지 파일 업로드 → AI 보정 → 결과 표시
- [ ] Before/After 비교 컷 다운로드 (원본+결과 나란히 합성)
- [ ] 인증 없이 접근 가능
- [ ] 결제 없이 생성 가능
- [ ] idphoto-kr 프로덕션 앱 영향 없음

---

## 완료 보고

- 커밋 해시 + Cloud Run 배포 URL
- 비교 컷 샘플 1장 첨부
- 형식: `✅❌💡⏳📁🔀`
