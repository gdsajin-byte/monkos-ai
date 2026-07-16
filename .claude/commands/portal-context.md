---
name: 포털컨텍스트
description: 포털/증명사진 서비스 작업 시 현재 구조·서비스 맵·소유권 계층·미해결 이슈를 로딩한다.
---

> 원천: 민아 포털 구조 감사 (REPORT_20260715) + PETITION_20260716 재작성
> **휘발 상수(rev 등)는 본문에 박지 않는다. 실측 명령을 쓴다.**

## 서비스 도메인 맵

| 서비스 | 도메인 | 인프라 | deploy.sh |
|--------|--------|--------|-----------|
| 포털 | monkos.ai | Cloud Run | `monkos_AI/portal/deploy.sh` |
| 증명사진 KR | idphoto-kr.monkos.ai | Cloud Run | `monkos_AI/idphoto-kr/deploy.sh` |
| 증명사진 JP | idphoto-jp.monkos.ai | Cloud Run | `monkos_AI/idphoto-jp/deploy.sh` |
| 크롭 엔진 | (내부) | Cloud Run | `monkos_AI/crop-engine/deploy.sh` |
| monk.kr | monk.kr | CF Pages | `MONK_kr/` |
| pt.monkos.ai | pt.monkos.ai | Cloud Run | [2조 한시적 예외] |

## 포털 파일 구조

```
monkos_AI/portal/
├── server.js              ← 메인 서버 (~1,220행, 라우팅 19분기+생성API+게이트)
├── lib/
│   ├── cms/
│   │   ├── render.js      ← SSR 렌더러 진입점 (fragment 분리)
│   │   ├── render-specs.js ← specs SSR (~1,800행)
│   │   ├── render-headshot.js
│   │   ├── render-blog.js
│   │   ├── render-sitemap.js
│   │   ├── specs-data.json ← 428 규격 데이터
│   │   ├── specs-i18n.js
│   │   ├── spec-funnel-markup.js
│   │   ├── attire-picker.js
│   │   └── render-shell.js ← 공유 HTML 셸
│   ├── shared/config.js    ← 가격·상수 정본
│   ├── auth.js, credits.js, payments.js
│   ├── gcs-save.js        ← GCS 저장 + Firestore generations
│   └── headshot-*.js, vton/
├── public/
│   ├── js/
│   │   ├── specs-funnel.js ← 퍼널 클라 위젯 (~1,200행)
│   │   ├── auth.js, credits.js, chat.js, main.js
│   │   └── headshot.js
│   ├── admin/              ← 어드민 패널 (dashboard, citadel, user)
│   └── css/
└── deploy.sh
```

## 소유권 4계층 (L0~L3)

| 계층 | 소유 | 역할 |
|------|------|------|
| L0 토큰 | 디자인 토큰 (colors, spacing, typography) | 조화 정본. 현재 미구현 → 구현 예정 |
| L1 셸·슬롯 | render-shell.js | 배치권 (헤더·푸터·레이아웃) |
| L2 컴포넌트 | specs·headshot·blog 각 렌더러 | 콘텐츠·행동 |
| L3 전역 서비스 | Auth·Pay intent 패턴 | 인증·결제 봉인 |

## i18n 체계

- specs: SPECS_I18N (specs-i18n.js) + locField() 범용 함수
- 지원 언어: ko(기본), en, ja, es
- 가격: config.js PRODUCTS 정본 → 표시 문자열 파생 (ch2 7조)

## 미해결 이슈

- 포털 파비콘 Google 검색 결과 미노출
- L0 디자인 토큰 미구현 (:root 변수 부재)
- server.js 모놀리스 (~1,220행) — /idpass 허브 라우터 분리 예정

## specs 전용 컨텍스트

specs 작업 시에는 `/specs-context` 스킬을 추가 로딩한다.

## 실측 명령

```bash
# prod rev
gcloud run services describe monkos-portal --region us-central1 --format='value(status.latestReadyRevisionName)'

# dev rev
gcloud run services describe monkos-portal-dev --region us-central1 --format='value(status.latestReadyRevisionName)'

# health check
curl -s https://monkos.ai/api/health | head -1

# 서비스 목록
gcloud run services list --region us-central1 --format='table(SERVICE,LAST_DEPLOYED_REVISION,URL)'
```
