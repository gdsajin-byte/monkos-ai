# 인프라 상수 정본 참조

> **사본 금지**: 이 문서는 상수의 정본이거나, 정본으로 가는 포인터이다. 값을 복사하여 다른 문서에 박지 않는다.
> 각 항목의 정본 위치를 명기한다. 값이 바뀌면 정본을 고치고, 이 문서의 포인터만 확인한다.

## 서비스 도메인

| 서비스 | 도메인 | 인프라 | 정본 |
|--------|--------|--------|------|
| 포털 | monkos.ai | Cloud Run | deploy.sh |
| 증명사진 KR | idphoto-kr.monkos.ai | Cloud Run | idphoto-kr/deploy.sh |
| 증명사진 JP | idphoto-jp.monkos.ai | Cloud Run | idphoto-jp/deploy.sh |
| 크롭 엔진 | (내부) | Cloud Run | crop-engine/deploy.sh |
| monk.kr | monk.kr | CF Pages | MONK_kr/ |
| pt.monkos.ai | pt.monkos.ai | Cloud Run | [2조 한시적 예외] |

## 배포

- 정본: `deploy.sh` (각 서비스 디렉토리). `gcloud run deploy` 직접 실행 금지 (ch5).
- 프로젝트: `monkos` (정본: deploy.sh:51)
- 리전: `us-central1` (정본: deploy.sh:52). 하드코딩 금지.
- prod rev 실측: `gcloud run services describe monkos-portal --region us-central1 --format='value(status.latestReadyRevisionName)'`

## 가격

- 정본: `lib/shared/config.js` PRODUCTS + LEMON_VARIANT_MAP
- 10c = $1 = ₩1,500 = ¥150 (2026-07-06 작가님 확정, config.js:142)
- 표시 문자열은 정본에서 파생. i18n 사전에 금액 하드코딩 금지 (ch2 7조).

## Specs URL 정본 패턴

- 정본: `lib/cms/render-specs.js` ROUTE_MAP(138행) + REDIRECT_MAP(139행)
- ko: `/specs/{type}/{country}` (프리픽스 없음)
- en/ja/es: `/{lang}/specs/{type}/{country}`
- 데이터 키: `{country}-{type}` (specs-data.json)
- 구 슬러그(kr-passport, korea-passport) → 301 리다이렉트 → 정본
- URL 직접 조립 금지. 빌더 함수 경유 필수 (ch2 7조, 구현 예정: specs-url.js).

## 시크릿

- 정본: GCP Secret Manager
- 인벤토리(메타만): `monkos-ops/ops/SECRET_INVENTORY.md`
- 에이전트 접촉 금지. `secret` 커맨드 경유. 상세: ch4 10조 + data-access.md

## 모델 배치

- 정본: 작가님 지시 (유동적)
- 현행 실측: `claude --version` + settings.json 확인
- 메모리 `project_model_placement.md`는 스냅샷 — 실측이 우선
