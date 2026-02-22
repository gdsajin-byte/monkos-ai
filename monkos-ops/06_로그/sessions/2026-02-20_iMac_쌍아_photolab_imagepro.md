# 세션 로그

**[2026-02-20 17:04~19:30 KST]** iMac/쌍아 → 작가님

---

## 요약

photolab MPA 현황 파악 후, IMAGE PRO(이미지 프로) 쪽으로 관심 전환. Imagen 4 단가 조사 및 FAST/ULTRA 스위칭 현황 확인.

## 진행 내역

### ✅ photolab MPA 현황 파악
- 막내가 5페이지 MPA 구조 전체 파악 완료 (index/prep/camera/result/thankyou + options)
- CF Functions 4개 정상 존재 (precheck, idgen, idphoto-coaching, idphoto-credit-use)
- 잔류 SPA 파일 정리 대상 식별 (app.js, *_spa_backup.*, index_00079.html 등)

### ✅ Imagen 4 단가 조사
- **Fast**: $0.02/장 (~29원), ~2.7초
- **Standard**: $0.04/장 (~58원)
- **Ultra**: $0.06/장 (~87원)
- 현재 generate.js 기본값: `model || 'fast'`

### ✅ IMAGE PRO 현황 확인
- FAST/ULTRA 스위칭 UI 이미 구현 완료
- Neural Report (Reversed Prompt + Stylistic Fingerprint + Extracted Tags) 동작 확인
- Fast 퀄리티 충분 — 장당 29원 가성비 확인

### 💡 생성 대기 시간 광고 삽입 아이디어
- 이미지 생성 대기 시간(~2.7초+)을 광고 채널로 활용
- 사용자 이탈 없이 자연스러운 광고 노출 가능
- 작가님 아이디어, 상세 설계 미진행

## 미진행

- ⏳ photolab 작업 지시서 — IMAGE PRO 쪽으로 관심 전환되어 보류
- ⏳ IMAGE PRO 광고 삽입 상세 설계

## 방향

- 작가님 관심이 IMAGE PRO 쪽으로 이동
- photolab vs IMAGE PRO 우선순위 작가님 판단 대기
