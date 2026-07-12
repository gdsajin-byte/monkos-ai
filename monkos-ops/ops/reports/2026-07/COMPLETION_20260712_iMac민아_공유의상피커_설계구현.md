---
type: completion
date: 2026-07-12
device: iMac
agent: 민아
portfolio: PF_SPECS
status: 마감
---

# COMPLETION — 공유 의상 피커 종합 설계 + v1 구현 + 시현

**[2026-07-12 12:36 KST]** iMac/민아 → 작가님

> 지시 (2026-07-12, 경로③ 작가님 직접): 피커 신규 UI 설계부터 — idpass·헤드샷·스타일러 확장 고려, 기존 리서치 맥락 파악, 데이터 스키마 구현, 피커 공유·카테고리 체계, 버킷 정합, DB·커머셜 성장, CITADEL 홍보 방안 포함 종합 설계, 완성 시 스펙스 파일럿 시현.

## ✅ 완료

1. **종합 설계서** — [DESIGN_20260712_공유의상피커_종합설계.md](../../../tech/designs/2026-07/DESIGN_20260712_공유의상피커_종합설계.md)
   - 카테고리 체계 = 공유의 단위 (서비스는 use_case로 조회, 카테고리 소유 없음 — idpass/헤드샷/스타일러 동일 아이템 교차 노출)
   - 버킷 정합 실사: 자산=`monk-ai-images/assets/attire/`(기존 assets·ads 관례), 개인=`monk-customer-photos/service/idpass/`(쌍아 7/10 유지). ⚠️ 쌍아안 1건 정정 제안(프리셋을 고객 버킷→자산 버킷으로)
   - DB 성장: JSON 정본 → Firestore `attire_presets/` 미러 (임계: 벤더 입점 / 50종+ / 운영 편집)
   - 커머셜: 벤더 슬롯 공개(표시)/비공개(수수료·계약 Firestore) 분리 — 공개 JSON 수수료 노출 사고 차단
   - CITADEL: 복장 가이드 AEO 섹션·광고 소재 파이프라인(ads/attire)·ItemList→Product 마크업 성장선·OG 재활용 4노출면
2. **스키마 데이터 정본** — `portal/public/components/attire-picker/attire-presets.json`
   - schema_version 2 · 32종 그릇(남16·여16) · **런칭 12종 active** · 카테고리 7종
   - 아이템별 attire_desc(나노2 [OUTFIT] 영문 프롬프트 — 프롬프트가 데이터라 배포 없이 JSON 교체로 튜닝) + ko/ja/en 라벨 + 스와치 + 벤더 null 슬롯
   - 검증: 파싱 OK·중복 0·필드 누락 0·active 12(남6·여6)
3. **공유 컴포넌트 v1 (텍스트형)** — `attire-picker.js`(의존성 0)·`attire-picker.css`(.atp- 격리)·`demo.html`(살아있는 스펙)
   - 성별 세그먼트→카테고리 칩→아이템 칩(스와치 투톤, thumbnail 채우면 이미지 자동 전환=v1.5 데이터 교체만)
   - 기본값 "지금 옷 그대로" 0단 통과 · 업로드 슬롯 자리(v3) · "연출 이미지" 고지 · radiogroup 키보드 접근성
   - 프리셋 로드 실패 시 자체 은닉 — 기본값 경로 생존(퍼널 무손상)
4. **시현 (스펙스 파일럿 데모)** — 로컬 dev 실주행 (`/components/attire-picker/demo.html`)
   - 데스크톱 그리드/모바일 가로칩 · 선택→attireDesc 페이로드 · 성별 전환+기본값 복귀 · 카테고리 재구성 · ja 전환 · headshot 빈세트 우아한 강등 · **콘솔 에러 0**
5. **수렴 제안서** — [PROPOSAL_20260712_민아_의상피커_수렴경로.md](../../proposals/PROPOSAL_20260712_민아_의상피커_수렴경로.md)

## 🔀 병렬 트랙 발견 (중요)

- 착수 중 `render-specs.js` **미커밋 +204줄** 확인 — 쌍아 트랙 Phase 2.7 **조합형 의상 선택** 금일 구현 중 (타입4×컬러×타이 조합, body.attireDesc 배선까지 완결 수준). 8080 dev 서버 가동 중.
- 같은 파일 동시 수정 회피 — **민아 산출물은 전부 신규 파일**, render-specs.js 무접촉. 두 구현은 충돌 아닌 계승 관계(조합형=최속 론칭 / 프리셋형=커머스·멀티서비스 정본). 수렴은 제안서 A안: v1 쌍아 조합형 유지, v1.5(상품컷)·헤드샷·스타일러 시점에 공유 피커 편입.

## 💡 판단 대기 (작가님)

- 수렴 A안 승인 여부 + GA4 `attire_select` 계측 통일(쌍아 트랙 반영)
- 상품컷 12종 생성·검수 일정 (v1.5 트리거)

## 📁 산출물

| 구분 | 경로 |
|------|------|
| 설계서 | monkos-ops/tech/designs/2026-07/DESIGN_20260712_공유의상피커_종합설계.md |
| 스키마 | monkos_AI/portal/public/components/attire-picker/attire-presets.json |
| 컴포넌트 | 〃 attire-picker.js · attire-picker.css · demo.html |
| 제안서 | monkos-ops/ops/proposals/PROPOSAL_20260712_민아_의상피커_수렴경로.md |
| 데모 | (dev) /components/attire-picker/demo.html — 배포 시 prod 동일 경로 |

배포: 미배포 (deploy = 민아 스코프 밖, 쌍아 트랙 커밋·배포에 동승 권장 — 신규 파일뿐이라 무충돌)
