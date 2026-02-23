# 지시서: idphoto-kr dev 배포

```
[2026-02-22 12:24 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **네 수정 범위**: 배포 실행 + 헬스체크 (파일 수정 없음)

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 크레딧 v2 + MPA 이관 + LP 리뉴얼 반영 dev 배포 |
| **수정 파일** | 없음 (배포만) |
| **배포 대상** | idphoto-kr dev |
| **브랜치** | `develop` |
| **긴급도** | 높음 |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 생성/추측 금지
- **헌법 제8조**: 파괴적 명령 금지
- **법률 제5장**: prod 배포 금지 (dev만)

---

## 작업 내역

### TASK 1: idphoto-kr dev 배포

```bash
cd monkos_AI/idphoto-kr
./deploy.sh dev
```

### TASK 2: 헬스체크 확인

```bash
curl -s https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app/health | python3 -m json.tool
```

`status: "healthy"` 확인.

### TASK 3: LP 접속 확인

```bash
curl -s -o /dev/null -w "%{http_code}" https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app/
```

`200` 확인. (새 index.html LP가 정상 서빙되는지)

---

## 금지 사항

- `prod` 배포 금지 (`./deploy.sh prod` 실행 금지)
- `.env` 수정 금지
- `server.js` 수정 금지
- `public/` 내 파일 수정 금지

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | idphoto-kr dev 배포 | **필수** |
| 2 | 헬스체크 healthy 확인 | **필수** |
| 3 | LP 200 확인 | **필수** |
| 4 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |

커밋/push 불필요 (파일 수정 없음).

---

## 완료 조건

1. idphoto-kr dev 헬스체크 `healthy`
2. LP(/) HTTP 200
3. 완료 보고 발신
