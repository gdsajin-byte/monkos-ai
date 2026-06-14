---
type: completion
date: 2026-06-14
device: iMac
agent: 막내2
portfolio: PF_IDPHOTO
status: 완료
---

# GA4 측정 ID 교차오염 수정 완료

> **[2026-06-14 13:28 KST]** iMac/막내2 → 작가님

## ✅ 완료

- idphoto-kr 12개 HTML: `G-JPZWSJ3323` 제거, 로더+config `G-FKG0CPTC14` 단일화
- idphoto-jp 18개 HTML: `G-FKG0CPTC14` 제거, 로더+config `G-JPZWSJ3323` 단일화
- idphoto-kr prod 배포 (rev 00196-f6p, deploy.sh 경유)
- idphoto-jp prod 배포 (rev 00121-xh4, deploy.sh 경유)
- 프로덕션 실측 검증: KR `tid=G-FKG0CPTC14`만 전송, JP `tid=G-JPZWSJ3323`만 전송 확인

## 💡 참고

- 지시서 기준 KR 12개 + JP 13개 = 25개였으나, JP는 guide/ 3개 + specs/ 2개 + tokusho.html 포함 총 18개 오염 확인 → 전수 수정
- 센서 코드(ai_referral_landing 등) 미변경

## 📁 산출물

- `monkos_AI/idphoto-kr/public/*.html` × 12 수정
- `monkos_AI/idphoto-jp/public/*.html` × 18 수정
- 본 COMPLETION 보고서
