---
type: completion
date: 2026-06-03
device: iMac
agent: 쌍아
portfolio: PF_AUTOPILOT
order: ORDER_20260602_M1쌍아_iMac쌍아_env하이브리드표준_정리
status: 마감
---

# COMPLETION — .env 시크릿 하이브리드 표준 적용 + GCP 일괄 등록 (광역오더 #8)

**[2026-06-03 14:02 KST] iMac/쌍아 → 작가님**

## ✅ 완료

### 1. 분류 (하이브리드 표준)
- 정본 `monkos_AI/.env` 유니크 34종을 §0 표준으로 분류: **시크릿 24 / 설정 10**.
- 경계 4건 작가님 확정: ADMIN_UIDS=시크릿(보수), NAVER_CLIENT_ID·LINE_CHANNEL_ID·TEAM_CHAT_ID=설정.

### 2. GCP Secret Manager 등록 (시크릿 24종)
- 변수명 그대로 등록. `.env` 값 → **stdin 파이프**(`gcloud secrets create/versions add --data-file=-`), **값 일절 무노출**.
- GEMINI_API_KEY는 기존 시크릿에 버전 추가, 나머지 23종 신규 생성.
- **복원 정합 검증**: GCP latest ↔ .env 해시 대조 **24/24 일치**.

### 3. CF_WORKERS_AI_TOKEN 정리 (dead placeholder 규명)
- `.env`에 `붙여넣기` placeholder **2행 중복** + Cloud Run portal 부재 + **코드 참조 0건** → dead 확정.
- 처리: GCP 시크릿 삭제 + `.env` 2행 완전 제거(백업 `monkos_AI/.env.bak-20260603`).
- `.gitignore`에 `.env.bak*` 패턴 추가(백업 추적 방지).

### 4. N8N_API_KEY 위치 확정
- 인벤토리상 "iMac .env 부재(4060 추정)"였으나 **현재 iMac 정본 .env에 존재** 확인 → 시크릿으로 GCP 등록.

### 5. 문서 명문화
- `SECRET_INVENTORY.md` §0 신설(하이브리드 표준 + .env 분류 + GCP 등록 현황), §A·§J 갱신.
- `PF_AUTOPILOT/README.md` 히스토리 1행.

## ⏳ 이월
- **M1 .env 갭(-20) 실측·동기화** — 2026-06-03 M1 offline(ping 100% loss)으로 미실행. M1 온라인 시: 시크릿은 GCP 복원, 설정은 .env 정본 배포.

## 💡 교훈
- "25/25 일치" 정합 검증이 **함정**이었음 — .env·GCP 양쪽이 동일 placeholder(`붙여넣기`)라 일치로 표시. 중복 정리하려 값을 들여다본 덕에 dead placeholder 포착. **"완료를 의심하고 실측" 방향타 작동** — 안 봤으면 쓰레기 시크릿을 정본으로 묻을 뻔.
- 값 검증은 등록 **전**에. (이번엔 등록 후 포착 → 즉시 정정)

## 📁 산출물
- `monkos-ops/ops/SECRET_INVENTORY.md`
- `monkos-ops/ops/portfolios/PF_AUTOPILOT/README.md`
- `.gitignore`
- GCP Secret Manager: 시크릿 24종(project=monkos)
