# 지시서: 크레딧 v2 배포 + README 정리

```
[2026-02-22 11:33 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **네 수정 범위**: `monkos_AI/idphoto-kr/README.md` + 배포 실행

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 크레딧 v2 + LP 리뉴얼 dev 배포 + README 정리 |
| **수정 파일** | `monkos_AI/idphoto-kr/README.md` (1개) |
| **배포 대상** | idphoto-kr dev, portal dev |
| **브랜치** | `develop` |
| **긴급도** | 높음 |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 생성/추측 금지
- **헌법 제8조**: 파괴적 명령 금지
- **법률 제5장**: prod 배포 금지 (dev만)

---

## 작업 내역

### TASK 1: README.md 수정 — landing.html 참조 제거

`monkos_AI/idphoto-kr/README.md`에서 `landing.html` 참조 2건을 현행화:

**줄 38-39 (파일 트리):**
```
변경 전: ├── index.html      ← 촬영 앱 (/app)
         ├── landing.html    ← 랜딩 페이지 (/)
변경 후: ├── index.html      ← 랜딩 페이지 (/) + 촬영 앱 (/app)
```
`landing.html` 줄 삭제, `index.html` 설명 수정.

**줄 63 (URL 구조 테이블):**
```
변경 전: | `/` | 랜딩 페이지 (landing.html) |
변경 후: | `/` | 랜딩 페이지 (index.html) |
```

또한 파일 트리에 MPA 파일들이 누락되어 있으므로 현행 반영:
```
└── public/
    ├── index.html      ← 랜딩 페이지 (/)
    ├── prep.html       ← 준비실 (/prep)
    ├── camera.html     ← 촬영실 (/camera)
    ├── result.html     ← 분석실 (/result)
    ├── thankyou.html   ← 수령처 (/thankyou)
    ├── app.css         ← 공통 스타일
    ├── monk.js         ← 프레임워크 코어
    ├── config.js       ← 환경설정
    ├── shared.js       ← 공통 로직
    ├── prep.js         ← 준비실 로직
    ├── camera.js       ← 촬영실 로직
    ├── result.js       ← 분석실 로직
    ├── thankyou.js     ← 수령처 로직
    ├── options.js      ← 옵션 로직
    ├── privacy.html    ← 개인정보처리방침
    ├── terms.html      ← 이용약관
    ├── refund.html     ← 환불 정책
    ├── monkos-icon.svg
    └── og-image.png
```

URL 구조 테이블도 MPA 라우트 반영:
```
| 경로 | 페이지 |
|------|--------|
| `/` | 랜딩 페이지 (index.html) |
| `/app` | 촬영 앱 (index.html) |
| `/prep` | 준비실 (prep.html) |
| `/camera` | 촬영실 (camera.html) |
| `/result` | 분석실 (result.html) |
| `/thankyou` | 수령처 (thankyou.html) |
| `/health` | 헬스체크 |
```

### TASK 2: idphoto-kr dev 배포

```bash
cd monkos_AI/idphoto-kr
./deploy.sh dev
```

배포 완료 후 헬스체크 확인:
```bash
curl -s https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app/health | python3 -m json.tool
```

`status: "healthy"` 확인.

### TASK 3: portal dev 배포

```bash
cd monkos_AI/portal
./deploy.sh dev
```

배포 완료 후 헬스체크 확인:
```bash
curl -s https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/health | python3 -m json.tool
```

---

## 금지 사항

- `prod` 배포 금지 (`./deploy.sh prod` 실행 금지)
- `.env` 수정 금지
- `server.js` 수정 금지
- `public/` 내 JS/HTML 수정 금지
- API 키 하드코딩 금지

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | README.md 수정 → `develop` 커밋 | **필수** |
| 2 | `git push origin develop` | **필수** |
| 3 | idphoto-kr dev 배포 + 헬스체크 | **필수** |
| 4 | portal dev 배포 + 헬스체크 | **필수** |
| 5 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |

### 커밋 메시지 형식

```
[docs] idphoto-kr README.md 현행화 — MPA 이관 + LP 파일명 반영

지시서: TASK_20260222_막내1_deploy_cleanup.md
```

---

## 완료 조건

1. README.md에 `landing.html` 참조 0건
2. README.md 파일 트리 + URL 테이블이 현행 MPA 구조 반영
3. idphoto-kr dev 헬스체크 healthy
4. portal dev 헬스체크 healthy
5. develop 커밋 + push 완료
6. 완료 보고 발신
