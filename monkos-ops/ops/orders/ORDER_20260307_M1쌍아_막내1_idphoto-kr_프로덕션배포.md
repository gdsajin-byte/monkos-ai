---
type: ORDER
date: 2026-03-07
from: M1/쌍아
to: 막내1
scope: idphoto-kr 프로덕션 배포 (AutoShot 자동촬영)
prerequisite: 668997e push 완료
ref: 2026-03-07 05:30 KST 작가님 배포 승인
---

# 지시서: idphoto-kr 프로덕션 배포

> **[2026-03-07 05:30 KST] M1/쌍아 → 막내1**

---

## 배포 대상

- **서비스**: idphoto-kr (Cloud Run)
- **커밋**: `668997e` [feat] 촬영실 AutoShot
- **환경**: prod

## 배포 명령

```bash
cd monkos_AI/idphoto-kr
./deploy.sh prod
```

## 배포 후 확인

| # | 항목 |
|---|------|
| 1 | Cloud Run 리비전 번호 기록 |
| 2 | 헬스체크: `https://idphoto-kr.monkos.ai` 접속 정상 |
| 3 | 카메라 페이지 진입 시 AI 코칭 WS 연결 정상 |

## 수정 파일 목록

없음. 배포만 실행.
