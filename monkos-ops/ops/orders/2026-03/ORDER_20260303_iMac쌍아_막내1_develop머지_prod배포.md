---
type: ORDER
date: 2026-03-03
from: iMac/쌍아
to: 막내1
priority: CRITICAL
scope: develop→main 머지 + prod 배포
special: "[특별법] 작가님-쌍아 합의에 의한 prod 배포 위임"
---

# 지시서: develop→main 머지 + Cloud Run prod 배포

> **[2026-03-03 14:30 KST] iMac/쌍아 → 막내1**

---

## 배경

v5 퍼널 리팩토링(thankyou 전환 + 핫픽스) 완료. develop에 11개 커밋 미머지 상태. 작가님이 프로덕션 E2E 테스트를 위해 즉시 배포 지시.

---

## 작업 순서

### 1단계: develop → main 머지

```bash
git checkout main
git pull origin main
git merge develop --no-ff -m "[merge] develop→main — v5 thankyou 전환 + 핫픽스 + 전수검토 보고서"
git push origin main
```

- `--no-ff` 필수 (머지 커밋 기록 보존)
- 충돌 발생 시 **중단 → 보고** (자의적 해결 금지)

### 2단계: Cloud Run prod 배포

```bash
cd monkos_AI/idphoto-kr
./deploy.sh prod
```

- 법률 제5장 2조: 반드시 `deploy.sh` 경유
- 법률 제5장 3조: `[특별법]` 작가님-쌍아 합의에 의한 prod 배포 위임

### 3단계: 배포 확인

- `https://idphoto-kr.monkos.ai` 접속 확인
- 서버 응답 200 OK 확인
- 콘솔 에러 없음 확인

---

## 머지 대상 커밋 (11건)

| 커밋 | 내용 | 유형 |
|------|------|------|
| `804cefb` | 막내1 세션 로그 + v5 프론트엔드 기술명세 | docs |
| `341e6fa` | v5 전환 기술명세 + 막내2 세션 로그 | docs |
| `8c27dd5` | v5 기술명세 라인번호 검증·보정 + 막내4 보고서 | docs |
| `d267b8c` | iMac/막내3 세션 마감 로그 | log |
| `cc5a812` | **prep.js 아코디언 열림 불가 수정** | hotfix |
| `cd41d84` | 막내2 포스트다운로드 데이터흐름 전수조사 보고서 | report |
| `c8ff486` | 막내1 v5 퍼널 로직 전수검토 보고서 | report |
| `385f556` | **thankyou.html/js v5 엔딩 페이지 전면 재작성** | feat |
| `1c24c75` | **result.js 포스트 다운로드 제거 + thankyou 전환** | refactor |
| `f23a5b4` | **thankyou v5 핫픽스 — 레이아웃/이중과금/토스트** | hotfix |
| `23a5585` | 지시서·보고서·세션로그 일괄 추가 | ops |

코드 변경 파일 (4개 커밋):
- `monkos_AI/idphoto-kr/public/prep.js`
- `monkos_AI/idphoto-kr/public/result.html`
- `monkos_AI/idphoto-kr/public/result.js`
- `monkos_AI/idphoto-kr/public/shared.js`
- `monkos_AI/idphoto-kr/public/thankyou.html`
- `monkos_AI/idphoto-kr/public/thankyou.js`

---

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 건드리지 않음
- **헌법 제8조**: `--force` 금지
- **법률 제5장 2조**: `deploy.sh` 경유 필수
- **법률 제6장 2조**: main 직접 커밋 금지 (머지만 허용)

---

## 완료 조건

- [ ] develop → main 머지 성공 (충돌 없음)
- [ ] `git push origin main` 완료
- [ ] `./deploy.sh prod` 성공
- [ ] 프로덕션 URL 접속 확인 (200 OK)
- [ ] 커밋 태그: `[merge]`

## 보고

- 형식: `[시각] iMac/막내1 → iMac/쌍아`
- 배포 로그 요약 포함
