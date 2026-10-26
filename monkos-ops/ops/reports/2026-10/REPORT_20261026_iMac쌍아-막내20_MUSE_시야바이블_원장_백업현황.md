---
type: report
date: 2026-10-26
device: iMac
agent: 쌍아-막내20
status: 마감
portfolio: PF_MUSE
subject: 시야 캐릭터 바이블·생성 원장·원본 백업 현황 (문서·조사만)
---

# REPORT — 시야 바이블 · 생성 원장 · 원본 백업 현황

**[2026-10-26 18:34 KST]** iMac/쌍아-막내20 → iMac/쌍아 (작가님 열람)

> 지시서: [ORDER_20261026 막내20](../../orders/2026-10/ORDER_20261026_iMac쌍아_막내20_MUSE_시야_캐릭터바이블_생성원장.md)
> 산출: [SIYA_BIBLE.md](../../portfolios/PF_MUSE/characters/SIYA_BIBLE.md) · [GEN_LEDGER.md](../../portfolios/PF_MUSE/characters/GEN_LEDGER.md)
> 이미지 생성·복사·업로드·이동 없음. 자산은 읽기만 했다(Read·sips·md5·ArcFace 로컬 측정).

## 요약 5줄

1. **시야 원본(12장 + 후보 2장)을 직접 보고** 불변·가변·금지·파일별 설명·도구 정책 지형을 바이블에 적었다. 기준 정면 이미지 칸은 "작가님 판정 대기(후보 pm_b)"로 비워 두었다.
2. **ArcFace 실측(18:30): 시야 폴더 안끼리 평균 0.387인데, 다른 폴더의 SUB_215와 시야 폴더 평균은 0.444다.** 폴더는 얼굴 지표로 한 인물로 묶이지 않는다 → 품질 게이트는 '기준 이미지 1장 대비'로만 걸 수 있다. 기준 이미지 확정이 첫 결정이다. 폴더 원본 중 중심도 1위는 MUSE_D_003(0.470), 최저는 faces/MUSE_C_003(0.231, 갈색 글램).
3. **생성 원장 36행 소급**(10-25~26, 유니·시야·SUB_215). 재시도 배수는 판정 미기록 14행 때문에 범위로만 나온다 — 하한 1.3~2.0, 기록만 보면 Vertex 3.7·전체 4.9. 쌍아의 3배 가정은 아직 검증도 반증도 안 된다.
4. **원본 2.5GB는 iMac 데스크톱 로컬(iCloud 비동기화, 미다운로드 placeholder 0건)**. 이름 기준 사본은 GCS·Google Drive에 없다. Time Machine(MONKOS_USB)에는 '포함' 상태지만 마지막 백업 시각은 권한 부족으로 확인 못 했다.
5. **최고 위험은 원본이 아니라 생성물이다** — pm_b(기준 후보)를 포함한 10-25~26 생성물 전부가 `/private/tmp/…/scratchpad/`(131MB, 임시 폴더)에 있다.

## 원본 백업 현황 (18:28~18:33 실측, 읽기 명령만)

### 폴더별 파일 수·용량 — `~/Desktop/iMac_archive/monk_assets/` (총 2.5GB)

| 폴더 | 파일 수 | 용량 | 비고 |
|---|---|---|---|
| `AI_LAb_Model/` | 344 | 1.0G | 하위 `민아/` 238·111M, `소소/` 62·871M, `탈락군/` 19·7.6M + 루트 생성 이미지·태그 json |
| `monk_assets_all/` | 486 | 233M | `SUB/` 417·203M, `MUSE_A` 17, `MUSE_B` 14, **`MUSE_C`(시야) 13·7.3M**, `MUSE_D` 6, 기타 4폴더 19 |
| `monk_models/` | 252 | 580M | dain 10, uni 11, 모델 45, 여성속옷모델 78, 윤교야스냅 86, 프로필 16 — **`siya/`·`모델/siya/` 둘 다 빈 폴더** |
| `monk_sorting/` | 40 | 47M | |
| `monk_workbench/` | 260 | 619M | `monk_models/`와 거의 같은 사본(diff: 런처·작업 파일 일부만 다름, 여성속옷모델 84 vs 78) |

### 저장 상태·사본

| 확인 항목 | 결과 | 방법 |
|---|---|---|
| iCloud 동기화 | **비동기화** — iCloud Drive에 Desktop 폴더 없음(Documents만 심볼릭 링크). 데스크톱의 `com.apple.icloud.desktop` 속성은 과거 흔적으로 판단 | `ls` iCloud Drive 루트, `xattr` |
| 미다운로드 placeholder | **0건** (전부 로컬 실물) | `find -flags +dataless` |
| `brctl status` | iCloud 데몬 정상, 대상 폴더와 무관 | `brctl status` |
| 로컬 다른 사본 | 없음(Spotlight 기준). 단 `SUB/faces/SUB_101.jpg`는 `MUSE_C/SUB_101.jpg`와 **이름만 같고 내용 다름**(MD5 불일치) | `mdfind -name`, `md5` |
| Time Machine | 대상 = **MONKOS_USB**(로컬 USB, 745G 중 233G 여유). `monk_assets`는 **[Included]**. **마지막 백업 시각 미확인**(tmutil 전체 디스크 접근 권한 필요) | `tmutil destinationinfo`, `tmutil isexcluded` |
| 외장 LaCie(2.9T, 827G 여유) | 마운트됨, **열람 권한 없음**(Operation not permitted) → 사본 여부 미확인 | `ls /Volumes` |
| GCS (프로젝트 monkos, 13버킷) | `monkos-models`·`monkos-works-assets`(763개)·`monk-ai-images`(22,441개)·`monk-project`(15,704개)에서 `SUB_###`·`MUSE_[A-D]` **0건**. 양성 대조: 같은 목록에서 `ads/` 13건 검출 → 조회 유효 | `gcloud storage ls` + grep |
| Google Drive | 파일명 `SUB_`·`MUSE_C`·`SUB_101`·`SUB_208` 이미지 **0건**. `monk_assets_tags.json`(25-12-26)만 존재. 양성 대조: 이미지 검색 자체는 결과 반환 | Drive 검색 |
| 다른 기기(M1·M2·4060) | 미조사(지시서 범위 밖 — 원격 접속 없음) | — |

> 결론: 원본의 확인된 사본은 **Time Machine 1개(시각 미확인)**뿐이고, 같은 책상 위 USB다. 오프사이트 사본은 확인된 것이 없다.

## 권고 (실행은 작가님 결정 후)

1. **[권고 1 — 즉시·무료] 임시 폴더 생성물 먼저 구출 + 원본 2.5GB를 LaCie에 2차 사본.** 원본보다 `scratchpad/`(131MB)가 먼저다 — pm_b·layer215·siya·uni 영상이 재부팅 정리로 사라질 수 있다. 보관 위치는 `monk_assets/` 아래 새 폴더(예: `generated/2026-10/`)로 원본과 한곳에 모으고, 원장 경로를 갱신한다. LaCie 사본은 작가님이 Finder에서 드래그 1회(에이전트는 LaCie 접근 권한이 없다).
2. **[권고 2 — 오프사이트] Google Drive 비공개 폴더 1곳에 전체 업로드.** 운영 원칙상 GDrive=창고(2TB), 2.6GB는 여유 범위다. GCS도 가능하지만 공개 서빙 버킷(`monk-ai-images`)과 섞이면 사고 위험이 있어 Drive가 낫다. 이너웨어 자산 포함이므로 공유 설정 없는 개인 폴더로.

## 작가님 결정 필요

- [ ] **시야 기준 정면 이미지**: pm_b / MUSE_D_003 / faces/MUSE_C_005·006 중 (바이블 §0·§5 — 각 수치 정리됨)
- [ ] **faces/MUSE_C_003**(갈색 글램, 폴더와 가장 먼 얼굴)을 시야 기준 세트에 둘지
- [ ] **백업 위치**: 권고 1(LaCie+원본 폴더로 생성물 구출) / 권고 2(Drive 오프사이트) / 둘 다
- [ ] **원장 판정 채우기**: Kling #5·22·36, 시야 정장 #11~13·19~21 합격 여부 — 채워지면 재시도 배수 확정
- [ ] (참고) Time Machine 마지막 백업 시각은 시스템 설정 > Time Machine에서 확인 가능

## 완료 보고

- ✅ 바이블: 불변·가변·금지·파일별 설명(14행)·기준 이미지 칸(판정 대기)·도구 정책 지형·ArcFace 실측
- ✅ 원장: 양식 + 소급 36행(출처 행 번호 병기) + 재시도 배수 표 + 기입 절차
- ✅ 백업 현황: 폴더 표·저장 상태·사본 조사(대조군 포함)·권고 2·결정 항목
- 💡 폴더 내부 얼굴 유사도(0.387)가 타 캐릭터 대비(0.444)보다 낮다 — 품질 게이트 설계의 전제(기준 1장)로 반영
- ⏳ 작가님 결정 5건(위)
- 📁 `monkos-ops/ops/portfolios/PF_MUSE/characters/{SIYA_BIBLE,GEN_LEDGER}.md`, 본 보고서
- 🔀 다음: 기준 이미지 확정 → 원장 신규 행부터 기준 대비 유사도 기입
