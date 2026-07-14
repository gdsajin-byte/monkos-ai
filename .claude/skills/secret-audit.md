---
name: secret-audit
description: GCP Secret Manager vs SECRET_INVENTORY.md 대사 — 미등재 시크릿 보고
user_invocable: true
---

# /secret-audit — 시크릿 인벤토리 감사

이 스킬이 호출되면 아래 순서로 실행한다:

1. `scripts/audit_secrets.sh` 실행
   - GCP Secret Manager 전체 목록 vs SECRET_INVENTORY.md 대사
   - 미등재 시크릿 경고 출력

2. 불일치 발견 시:
   - 미등재 항목 목록을 보고
   - SECRET_INVENTORY.md §J에 추가할 항목 제안
   - 값은 절대 노출하지 않는다 (헌법 4조 1항)

3. 전량 일치 시: "✅ 전 항목 등재 확인" 보고
