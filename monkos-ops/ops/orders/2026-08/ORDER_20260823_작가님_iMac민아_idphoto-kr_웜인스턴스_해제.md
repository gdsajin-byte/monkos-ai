---
type: order
date: 2026-08-23
device: iMac
agent: 민아
status: 마감
---

# [사후 오더] idphoto-kr 웜 인스턴스 해제

**[2026-08-23 09:03 KST]** 작가님 → iMac/민아

> 헌법 제1조 2항 ③(민아 직접 지시 경로) + 쌍아 직접수정 프로토콜 준용.
> 작가님 구두 승인("승인. 직접 처리할것") 후 실행 → 사후 오더로 기록.

## 배경

작가님 문의: GCP 비용 이달 13만원 예상, 유지 가능 여부 검토 요청.
작가님 진술: "인스턴스 웜은 하나야, 포털만"

## 실측 (민아)

**① 진술과 코드 불일치**
- `monkos_AI/idphoto-kr/deploy.sh:71` — `MIN_INSTANCES="1"  # prod 상시 대기 = 콜드스타트 이탈 방지 (변경 금지)`
- portal(`deploy.sh:98`)과 동일 문구. **idphoto-kr도 웜 상태였음**
- 도입: `2ee054ff`(2026-07-04) dev 환경 분기화 시 prod=1 명시

**② Cloud Run 로그 실측 (최근 48시간, 총 783건)**

| 구분 | 건수 | 비중 |
|------|------|------|
| 봇성(wp-·.php·robots·sitemap·admin) | 675 | **86%** |
| 정적자산 | 42 | 5% |
| 실사용 페이지(`/`·`.html`) | **28** | 4% |

- 봇 유형: `/wp-content/plugins/hellopress/wp_filemanager.php`, `/wp-admin/network/index.php`, `/this_is_a_new_hello_world.php` 등 **워드프레스 취약점 스캐너** (본 서비스는 WP 아님)
- **실사용 페이지 요청 하루 약 14건**

**③ 대조군**: monkos.ai 14일 817세션(60일 2,560) → 포털은 웜 유지 명분 있음

**④ 매출**: 결제 42일째 0건 → 콜드스타트 이탈로 잃을 매출 없음

## 조치

1. `monkos_AI/idphoto-kr/deploy.sh:71` — `MIN_INSTANCES` **`"1"` → `"0"`**, 사유 주석 갱신
2. running 서비스 적용: `gcloud run services update monkos-idphoto-kr --region us-central1 --min-instances=0`
   - **판단 근거**: `./deploy.sh prod`는 `gcloud builds submit` 재빌드 + `--set-secrets`/`--update-env-vars` 재적용을 동반 → **콘솔 직접 설정값 덮어쓸 위험**. min-instances 단일 변경에 그 위험을 감수할 이유 없음. 이미지·환경변수 미변경 스케일 설정 변경으로 처리
   - **법률 ch5 검토**: 금지 대상은 `gcloud run deploy`·`gcloud builds submit`. `gcloud run services update`는 해당 없음

## 결과

- 리비전: `monkos-idphoto-kr-00204-9j6` → **`monkos-idphoto-kr-00205-ls6`** (100% 트래픽)
- min-instances 실측: idphoto-kr **0** / portal **1**(유지, 작가님 의도대로)
- 서비스 정상: `https://idphoto-kr.monkos.ai/` **HTTP 200, 0.60초**
- 예상 절감: **월 약 3.6만원** (13만 → 약 9.4만)

## 잔여 과제 (미승인 — 별도 판단 필요)

1. **dev 서비스 5종 정리** — portal-dev(2026-02-19) / idphoto-kr-dev(02-16) / studio-dev(03-18) / idphoto-jp-dev(03-25) / jangsam-dev(06-13). 최소 2~6개월 미갱신. min=0이라 유휴 비용은 없으나 이미지 스토리지 과금 존재
2. **봇 차단** — 48시간 675건(월 약 1만건). CF 방화벽 규칙 검토
3. **GA4 계측 누락** — idphoto-kr 60일 12세션 vs camera.html 유래 가입 22건 모순. 태그 점검 필요
4. **specs 정적화 → CF Pages 이전** — 월 2~3만 수준까지 절감 가능

## 롤백

```bash
gcloud run services update monkos-idphoto-kr --region us-central1 --min-instances=1
```
`deploy.sh:71`을 `MIN_INSTANCES="1"`로 되돌릴 것. 유료 전환 재개 시 재검토.
