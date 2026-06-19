---
type: order
date: 2026-06-19
from: iMac/쌍아
to: iMac/막내
portfolio:
status: 대기
---

# 지시서: IMAGE PRO TSX 현행화 + monkos_AI 편입

> **[2026-06-19 14:20 KST]** iMac/쌍아 → 막내
> 근거: 6/19 세션 — Resolution 2K 버튼 미작동 발견 → 번들 직접 패치 한계 확인 → TSX 정본화 결정
> 작가님 승인: 2026-06-19 14:20 KST

---

## 목적

IMAGE PRO(image.monkos.ai)의 프론트엔드가 민파이드 번들(index-v6.js) 직접 패치로 관리되어 수정·디버깅이 사실상 불가능한 상태. TSX 원본을 현행화하고 빌드 파이프라인을 복구하여 정상적인 개발 사이클로 되돌린다. 동시에 `apps/` PoC 위치에서 `monkos_AI/image-pro/`로 편입한다.

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: 시크릿/API키 생성·추측 금지. `.env`에 있는 값 그대로 사용
- **ch5 2조**: 배포는 deploy.sh 경유
- **절대 건드리지 말 것**: 백엔드 server.js의 `/generate`, `/refine`, `/analyze`, `/translate` 엔드포인트 로직. 프론트엔드만 작업

---

## 작업 내용

### Phase 1: TSX 원본 편입 + 현행화

1. **원본 복사**: `~/developer/monk-ai-studio-pro/` → `monkos_AI/image-pro/src/`로 편입
   - App.tsx, components/, services/, index.tsx, vite.config.ts, package.json, tsconfig.json

2. **v6 기능 역이식**: 현재 index-v6.js 번들에만 있는 기능을 TSX에 반영
   - 번들 분석 시 참고: `apps/monk_imagen4/backend/public/app/assets/index-v6.js`
   - **필수 역이식 항목**:
     - [ ] Sidebar + ControlPanel 컴포넌트 (번들의 `Th` 컴포넌트)
     - [ ] Protocol 스위칭 (NEW GENERATE / VARIATION)
     - [ ] Engine 선택 (Standard / Premium)
     - [ ] **Resolution 선택 (1K / 2K)** — 상태 연결 + 실제 동작
     - [ ] Ratio 선택 (1:1 / 16:9 / 9:16)
     - [ ] 광고 로딩 캐러셀 (GCS 매니페스트)
     - [ ] BatchDisplay (그리드/싱글 뷰)
     - [ ] Export 기능
     - [ ] Logs 패널

3. **Resolution 정상 구현**:
   - TSX: `useState<'1K'|'2K'>('1K')` 상태 추가, 버튼에 onClick 연결
   - API 호출 시 `imageSize` 파라미터 전송
   - 백엔드는 이미 수정 완료 (6/19 — `sampleImageSize: 2048, addOverscan: true`)

### Phase 2: 빌드 파이프라인 + 배포 구조

4. **vite.config.ts 조정**: 빌드 산출물이 `monkos_AI/image-pro/backend/public/app/` 으로 출력되도록

5. **백엔드 편입**: `apps/monk_imagen4/backend/` → `monkos_AI/image-pro/backend/`
   - server.js, Dockerfile, deploy.sh, package.json 이동
   - deploy.sh 경로 수정

6. **빌드 + 배포 테스트**:
   - `npm run build` → 산출물 확인
   - `deploy.sh production` → Cloud Run 배포
   - image.monkos.ai에서 전 기능 정상 확인

### Phase 3: 검증

7. **기능 체크리스트**:
   - [ ] T2I (NEW GENERATE): Standard/Premium 모두 생성 정상
   - [ ] I2I (VARIATION): 이미지 변주 정상
   - [ ] Resolution: 1K 선택 → 기본 해상도 / 2K 선택 → 고해상도 확인
   - [ ] Ratio: 1:1, 16:9, 9:16 전환
   - [ ] Export: 다운로드 정상
   - [ ] 광고 캐러셀: 로딩 시 표시

---

## 참고 자료

- 현행 v6 번들: `apps/monk_imagen4/backend/public/app/assets/index-v6.js`
- TSX 원본: `~/developer/monk-ai-studio-pro/` (v3 수준, 편입 대상)
- 백엔드 정본: `apps/monk_imagen4/backend/server.js`
- 맥락 정리: `monkos_AI/image-pro/README.md` (6/19 작성)
- v6 커밋 히스토리: `279aa3b8`, `32bc5462`, `aeb74bbf`, `064df031`

---

## 완료 기준

1. `monkos_AI/image-pro/src/` TSX 소스로 `npm run build` 성공
2. 빌드 산출물로 image.monkos.ai 전 기능 정상 동작
3. Resolution 1K/2K 선택이 실제 생성 해상도에 반영
4. `apps/monk_imagen4/backend/`의 파일이 `monkos_AI/image-pro/backend/`로 이동 완료
