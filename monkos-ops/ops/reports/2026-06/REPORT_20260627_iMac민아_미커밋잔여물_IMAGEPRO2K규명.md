---
type: report
date: 2026-06-27
device: iMac
agent: 민아
status: 마감
portfolio: PF_IMAGE_PRO
---

# 미커밋 잔여물 규명 — IMAGE PRO 2K + 동선 측정 오염

> **[2026-06-27 07:12 KST]** iMac/민아 → 작가님
> 트리거: "오늘 우선순위" 판단 중 작업트리 미커밋 변경 발견 → 정체·작업자·prod 반영 규명 (read-only)
> 처분: **작가님 사무실 출근 후 직접 실행** (본 보고서는 규명 결과 + 처분 체크리스트만 보존)

---

## 0. 한 줄 요약

작업트리에 6/19 IMAGE PRO 편입 당시의 **구 위치 중복 잔여물**이 미커밋으로 떠 있었음. 2K 백엔드 코드는 **이미 정본에 커밋됨** → 워킹트리 변경은 폐기 안전. 단 **2K 프론트 버튼(TSX)은 v6 롤백으로 prod 미반영 가능성** = 별개의 미완 과제.

---

## 1. 발견된 미커밋 잔여물 (전부 6/25 `pull --rebase` checkout으로 mtime 갱신, 실제 변경은 그 이전)

| 갈래 | 파일 | 정체 | prod 영향 |
|------|------|------|-----------|
| ① | `apps/monk_imagen4/backend/server.js`, `.../public/app/assets/index-v6.js` | IMAGE PRO Resolution 2K 패치 (`imageSize` + `sampleImageSize:2048, addOverscan:true`) | **구 위치 중복** — 정본에 동일 코드 커밋됨 |
| ② | `.claude/commands/portal-context.md` | 6/25 포털 라우팅 실측 현행화 (/pricing·/guide·/blog 404→200) | 문서 (안전) |
| ③ | `apps/crop-app/benchmark/rmbg-test.html` | 크롭앱 배경제거 RMBG-1.4 → 2.0 GPU 벤치마크 실험 | benchmark/ — prod 무관 R&D |
| 신규 | `monkos-ops/tech/designs/2026-06/portal_design_handoff/` | 포털 디자인 핸드오프(라이트/리스폰시브 레퍼런스 + 에셋), 6/22 | 디자인 산출물 (미추적) |

## 2. ① 작업자·맥락 규명 (핵심)

- 근거 지시서: [ORDER_20260619_iMac쌍아_막내_IMAGEPRO](../../orders/2026-06/ORDER_20260619_iMac쌍아_막내_IMAGEPRO_TSX현행화+편입.md) — "6/19 Resolution 2K 버튼 미작동 발견 → TSX 정본화 결정. **백엔드는 이미 수정 완료(6/19, sampleImageSize:2048, addOverscan:true)**". status: **대기** (완료보고 없음 = 미완성).
- 커밋 이력: `git log -S 'sampleImageSize'` → **301ae908 (6/19 정산, IMAGE PRO 편입)** 단 1건. 편입 시 백엔드를 `monkos_AI/image-pro/`로 복사·커밋.
- 정본 확인: `monkos_AI/image-pro/backend/server.js` line 90·136·141 에 2K 코드 **존재(커밋됨)**.
- 구 위치 `apps/monk_imagen4/backend/server.js` 의 워킹트리 변경 = **편입 전 원본에서 작업한 동일 패치의 중복**. apps/ 는 편입 후 레거시 PoC 위치.
- 두 `deploy.sh` 모두 `SERVICE_NAME="monk-image-engine"` (동일 Cloud Run 서비스).

→ **워킹트리 ① 변경은 버려도 손실 없음** (정본에 동일 코드 존재).

## 3. 남는 진짜 숙제 — 2K 프론트 미연결 (미해결, 출근 후 확인)

- 지시서: "v7 배포 → **v6 롤백(UI 불일치)**". 백엔드는 2K 수신 준비됨, **프론트 UI(2K 선택 버튼)는 v6 롤백으로 빠졌을 가능성**.
- 함의: 증명사진/헤드샷이 prod에서 **1K로만 출력 중일 수 있음** → specs v2 결제 동선 결과물 화질 직결.
- 미확정: Cloud Run 현재 리비전의 백엔드 2K 반영 여부 + 프론트 2K 버튼 노출 여부 (read-only 추가 검증 가능).

## 4. 곁다리 발견 (별도 트랙) — 토스 self-referral 측정 오염

- GA4 6/19~6/25: `payment-gateway.tosspayments.com` referral 33세션(+450%)의 착지가 `/`(25)·`/headshot`(4)·`(not set)`(3) = **결제 후 복귀 트래픽**(self-referral). organic/direct를 가로채 전환 경로 오염.
- 조치: GA4 → 관리 → 데이터 스트림 → 태그설정 → "원치 않는 추천 나열"에 `tosspayments.com` 추가 (설정 1줄).
- 참고: 광고 OFF 후 오가닉 +73%(133세션), 전체 +27% 순증 — 광고 중단 판단은 데이터상 옳았음. 동선은 "남자 증명사진"(노출79·CTR1.3%·8위) 등 CTR 개선 여지.

---

## 5. 출근 후 처분 체크리스트 (작가님 직접 실행)

- [ ] **② 커밋** — `git add .claude/commands/portal-context.md && git commit -m "[docs] 포털 라우팅 실측 현행화"` (검증된 사실, 안전)
- [ ] **① 폐기** — `git restore apps/monk_imagen4/backend/server.js apps/monk_imagen4/backend/public/app/assets/index-v6.js` (정본에 동일 코드 존재, 손실 없음). ※ apps/ 레거시 확정 시.
- [ ] **③ 처분** — `apps/crop-app/benchmark/rmbg-test.html` : RMBG-2.0 실험 보존 가치 판단 → `[research]` 커밋 or stash
- [ ] **신규 디자인** — `portal_design_handoff/` : 정본 위치(tech/designs) 적정. 커밋 여부 판단
- [ ] **2K 프론트 검증** — Cloud Run `monk-image-engine` 리비전 + 프론트 2K 버튼 노출 확인 → 미반영 시 ORDER_20260619 재개(쌍아 지시서 → 막내)
- [ ] **토스 referral 제외** — GA4 데이터 스트림 설정 1줄

> 본 보고서는 작업트리를 변경하지 않음. ①②③ 잔여물은 미커밋 그대로 보존됨.
