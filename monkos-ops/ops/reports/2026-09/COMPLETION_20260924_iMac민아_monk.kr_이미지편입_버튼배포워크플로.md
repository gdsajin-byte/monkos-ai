---
type: completion
date: 2026-09-24
device: iMac
agent: 민아
status: 마감
portfolio: PF_KKU
subject: monk.kr 이미지 17장 git 편입·재배포 + 버튼 배포 워크플로·ch5 1조 개정 청구
---

# COMPLETION — monk.kr 이미지 편입 + 버튼 배포 체계

**[2026-09-24 12:44 KST]** iMac/민아 → 작가님 (승인 12:38 "제안대로 모두 처리해 승인한다")

## 1. 이미지 편입 (쌍아 09-19 PF_KKU 판정의 후속 집행)
- 원본 17장 백업: `~/Pictures/monk_kr_originals_20260924/` (레포 밖, 경로 보존)
- 리사이즈 in-place: 긴 변 1400px(hero·main 1920), JPEG q82 progressive, EXIF 회전 반영. **76.8MB → 2.3MB**
- `.gitignore` 예외 2행(`monk_studio/images`·`family/images`), 캐시 버스터 `?v=20260924` 46참조/8페이지
- 커밋 7c1a0bde → CF Pages 배포(25파일) → 라이브 2회 히트: HTML v 파라미터 6·10건, 이미지 md5 3/3 로컬 일치
- 미참조 중복 1장(`family/images/블루녀-(3 of 9).jpg` = port1 동일본)도 리사이즈·편입 — 삭제는 작가님 판단

## 2. 버튼 배포 워크플로
- `.github/workflows/deploy-monk-kr.yml` — `workflow_dispatch`만(push 트리거 없음), 사유 입력 필수, 정본 확인(루트 functions)·concurrency 잠금·2회 히트 스모크
- **시크릿 미등록 → 실행 불가.** 필요 2종: `CF_PAGES_DEPLOY_TOKEN`(Pages: Edit 전용 신규 발급) · `CF_ACCOUNT_ID`. GitHub Secrets 등록은 작가님(`gh secret set` — 값 비접촉 원칙)

## 3. 개정 청구
- `governance/constitution/petitions/PETITION_20260924_민아_ch5_1조_monk.kr_버튼배포.md` — 쌍아 심사 대기. 조문안: 승인자 트리거 2경로 허용·push 트리거 금지·배포 대상 미추적 자산 금지

✅ 이미지 17장 편입·리사이즈·재배포·라이브 검증
✅ 워크플로 파일·청구안 커밋
⏳ 작가님: CF Pages 토큰 발급 → `secret add CF_PAGES_DEPLOY_TOKEN` + `gh secret set` 2종
⏳ 쌍아: 청구안 심사(막내 2명 영향평가), deploy-cf.md·deployment.md 동기
⏳ 첫 버튼 배포 실측 → 별도 COMPLETION
📁 본 문서 · 워크플로 · 청구안 · 세션 로그 · PF_KKU
