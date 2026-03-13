---
type: order
date: 2026-03-13
from: iMac/쌍아
to: 막내
status: pending
---

# 지시서: 챗봇 KB 시드 실행 + 3개 서비스 프로덕션 배포

## 배경
이벤트 잔재 정리 커밋(063e98b)이 main에 푸시 완료.
변경사항:
- `portal/lib/prompts.js` — 시스템 프롬프트에서 폐지 이벤트 제거
- `portal/seed_cs_knowledge.js` — KB 데이터에서 폐지 이벤트 제거 + JP 가격 현행화
- `portal/seed_cs_brand_story.js` — 브랜드 KB에서 폐지 이벤트 제거 + 데이터정책 URL 추가
- `idphoto-kr/server.js` — grantShareBonus + 엔드포인트 제거
- `idphoto-jp/server.js` — grantShareBonus + 엔드포인트 제거
- `idphoto-jp/public/thankyou.js` — setupSnsEvent 제거
- KR/JP/Portal 약관·정책 HTML — 공유 보너스 문구 제거

코드는 반영됐지만 **2가지가 미반영**:
1. Firestore `cs_knowledge` KB 데이터 (seed 스크립트 실행 필요)
2. Cloud Run 서비스 (재배포 필요)

## 작업 순서

### Step 1: git pull (최신 코드 확인)
```bash
cd ~/developer/monk_project && git pull origin main
```

### Step 2: Firestore KB 시드 실행
```bash
cd monkos_AI/portal
node seed_cs_knowledge.js
node seed_cs_brand_story.js
```
- 환경: ADC 인증 필요 (`gcloud auth application-default login` 완료 상태여야 함)
- 17건 문서가 Firestore `cs_knowledge` 컬렉션에 업데이트됨
- seed_cs_knowledge.js는 `set()` (덮어쓰기), seed_cs_brand_story.js는 `set({merge:true})`

### Step 3: 3개 서비스 프로덕션 배포
순서대로 실행 (각 배포 완료 확인 후 다음 진행):

```bash
# 1) Portal (챗봇 엔진 + 프롬프트 반영)
cd ~/developer/monk_project/monkos_AI/portal
./deploy.sh prod

# 2) idphoto-kr (server.js 변경 반영)
cd ~/developer/monk_project/monkos_AI/idphoto-kr
./deploy.sh prod

# 3) idphoto-jp (server.js + thankyou.js + HTML 변경 반영)
cd ~/developer/monk_project/monkos_AI/idphoto-jp
./deploy.sh prod
```

### Step 4: 배포 후 검증
각 서비스 챗봇에서 아래 질문으로 검증:
- "이벤트 있어?" / "イベントはありますか？"
  → 첫 로그인 10c만 안내해야 함. SNS 공유, 텔레그램 가입, 카카오 채널 등 언급 없어야 함
- "크레딧 얼마야?" / "クレジットはいくら？"
  → JP: ¥ 기준 가격 응답 확인

## ⚠️ 준수 조항
- 헌법 6조: `.env`, secrets 무단 수정 금지
- 헌법 8조: 파괴적 명령 금지 — deploy.sh만 사용, 수동 gcloud 명령 자제
- 법률 5장: 프로덕션 배포 시 main 브랜치 확인 (deploy.sh가 자동 체크)

## 완료 기준
- [ ] seed_cs_knowledge.js 실행 완료 (10건)
- [ ] seed_cs_brand_story.js 실행 완료 (7건)
- [ ] portal 프로덕션 배포 완료
- [ ] idphoto-kr 프로덕션 배포 완료
- [ ] idphoto-jp 프로덕션 배포 완료
- [ ] 챗봇 검증 — 폐지 이벤트 미언급 확인
- [ ] 완료 보고
