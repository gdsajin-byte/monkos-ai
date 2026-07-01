---
type: completion
date: 2026-06-19
device: 웹
agent: 민아
status: 마감
portfolio: PF_IDPHOTO
---

# COMPLETION — idphoto 퍼널 진단 + 어드민 리뷰 페이지 + SA 권한 검증

> **[2026-06-19 10:21 KST] 웹/민아 → 작가님**
> **분류**: COMPLETION (새벽 세션 종합 — 작가님 직접 지시 경로② / 익일 쌍아 추인 예정)
> **귀속**: PF_IDPHOTO(퍼널·진단) + PF_PORTAL(어드민 코드) + PF_SECURITY(SA 권한)
> **PR**: #86 (draft) — branch `claude/6-19-session-start-ndj3mv`

---

## 0. 발단
작가님 화두: "광고 없이 3명이 프리뷰까지 도달했는데 결제 0 — 가격 문제인가?"

## 1. GA4 퍼널 진단 — 결론: 가격 문제 아님
- **계측 완비 확인**: idphoto-kr 7종 이벤트(spec_select·photo_upload·sign_up·generate_click·preview_view·begin_checkout·purchase) + 공통 4파라미터 전부 코드 구현·라이브(G-FKG0CPTC14). 6/12 설계서(DESIGN_20260612_GA4퍼널센서_스키마) 대로 100% 구현.
- **데이터 경로 규명**: 라이브 호출 불요 — 05:00 AUTOPILOT(GitHub Actions, GH Secrets)가 퍼널 6종을 매일 수집해 브리핑에 적재. 웹 환경은 보안 사양상 SA 키 미주입(루틴 문서 109행).
- **실측(브리핑 적재값)**: 6/17 = preview_view 1 → **begin_checkout 0** → purchase 0. 6/11~13 전부 0. 6/14~16 브리핑 결측(AUTOPILOT 7시런 실패, Fable5 수출통제).
- **판정**: `begin_checkout`은 다운로드 핸들러 최상단(result.js:327)에서 발화, 버튼은 프리뷰 시점 활성·노출(292행). **계측 정상 → 0은 진짜 행동** = 결과를 보고 다운로드(=결제벽)에 닿지조차 않음. 가격이면 begin_checkout>0 후 purchase 이탈이어야 함. **이탈은 preview_view→begin_checkout 구간 = 결과물 만족/정체성 보존(헌법 1조 3항) 또는 프리뷰 UX 문제.** (단, n=1~3으로 통계적 확정 불가, 방향만 명확)

## 2. 어드민 idphoto 리뷰 페이지 (PR #86) ✅
버킷 직접 열람의 번거로움 해소 + 프리뷰 품질 내부 QA용. 작가님 승인 후 구현(경로②).
- `lib/cms/idphoto-review.js` — `service/idphoto/{kr|jp}/` 나열 → userId+timestamp로 원본↔결과물 짝맞춤 → Signed URL(1h)
- `server.js` — `GET /api/admin/idphoto/results` (requireAdmin 가드)
- `admin/idphoto-review.html` — KR/JP 토글, 좌우 비교 그리드, 라이트박스
- `admin/index.html` — 내부 도구 메뉴 카드
- 검증: `node --check` 통과, KR/JP 경로 규약 양쪽 일치. 기존 패턴(getFiles·requireAdmin·dashboard 인증) 재사용, 스키마 변경 0.
- ⚠️ 개인정보(고객 얼굴 원본): 어드민 인증 뒤에만 노출 + Signed URL 1h 만료.

## 3. 보안 검증 — "이 구조가 외부 해커봇 직접 배포를 방어하나?" ✅
- **웹 컨테이너 층**: gcloud·SA·ADC·메타데이터(403) 전무 → 탈취돼도 배포 불가(blast radius 격리).
- **자동배포 부재**: `.github/workflows` 8종 중 Cloud Run 배포 워크플로 없음 → **merge ≠ 배포**.
- **GH Secrets 층**: `GCP_SA_KEY` = yong-a-orchestrator(키 c1b7e5a702b8). **editor·run.admin·secretAccessor 없음** → 키 유출돼도 배포·파괴·권한상승 불가. **2026-06-19 작가님 직접 editor 삭제 확정**(SECRET_INVENTORY 154↔227 모순 해소·정본 보정).
- **잔여 위험**: yong-a-orchestrator `storage.objectAdmin`(버킷 고객사진 R/W/삭제) + `aiplatform.user`(Vertex 비용) — 🟡 등재, objectViewer 축소 검토 권고. 진짜 주공격면은 PR 공급망(악성코드 머지→정상배포 탑승) → 코드리뷰·브랜치보호·dev 선검증으로 방어.

## 산출물
| 커밋 | 내용 |
|------|------|
| `0fb98c47` | 어드민 idphoto 리뷰 페이지 (코드 4파일) |
| `e8c0c86d` | 배포 지시서 ORDER_20260619 (맥 막내용) |
| `86320205` | SECRET_INVENTORY 정본 보정 (editor 삭제 확정) |

## 미결 / 인계 (제 환경 밖)
- ⏳ **PR #86 배포**: 맥에서 `deploy.sh dev`→검증→`prod` (ORDER_20260619 참조). 익일 쌍아 추인.
- 🔀 **`thankyou.js:182` `purchase value:0` 버그**: 첫 결제 시 GA4 매출 누락. 별도 지시서 필요.
- ⏳ **결과물 직접 실측**: 배포 후 그 1~3명 보정본 정체성 보존 확인 → 품질 vs 가격 최종 판가름.
- 🟡 **yong-a-orchestrator objectAdmin→objectViewer 축소** 검토.
