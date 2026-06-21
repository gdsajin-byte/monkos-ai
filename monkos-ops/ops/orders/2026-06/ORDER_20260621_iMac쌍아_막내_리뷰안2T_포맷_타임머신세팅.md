---
type: order
date: 2026-06-21
from: iMac/쌍아
to: iMac/막내
status: 대기
portfolio: PF_INFRA
subject: 리뷰안2T 포맷 + Time Machine 세팅 — 임시백업→포맷→TM→하드 재정리
---

# 리뷰안2T 포맷 + Time Machine 세팅

> **[2026-06-21 14:13 KST]** iMac/쌍아 → 막내
> 작가님 지시: 리뷰안을 비워서 포맷하고 Time Machine을 세팅한 뒤 하드를 재정리하라.

## 1. 현재 상태

### 리뷰안2T (대상 디스크)

| 항목 | 수치 |
|------|------|
| 전체 | 1.9 TB |
| 사용 | 233 GB (13%) |
| 가용 | 1.6 TB |
| 마운트 | `/Volumes/리뷰안2T 1` |

### 잔여 데이터 (234 GB)

| 폴더 | 용량 | 성격 |
|------|------|------|
| 최근백업 | 72 GB | 2025-12 iMac 백업 (P800드라이버, 모델, 사진작업 등) |
| 기존백업 | 70 GB | 고객 촬영, 부동산, 스크린캡쳐 등 |
| 백업2 | 53 GB | 촬영물 잔여 (영상백업 859GB 삭제 후) |
| iMac_archive | 39 GB | monk_assets, 촬영_archive, lightroom, AI세션 등 |
| 캡쳐원맥 23pro | 0 (빈 폴더) |
| 준혁이네스냅 | 0 (빈 폴더) |
| api | 4 KB |

### 대피 대상: MONKOS_USB

| 항목 | 수치 |
|------|------|
| 전체 | 745 GB |
| 사용 | 14 GB (2%) |
| **가용** | **730 GB** — 리뷰안 234 GB 수용 충분 |
| 포맷 | exFAT (Mac/Windows 호환) |
| 마운트 | `/Volumes/MONKOS_USB` |

## 2. 실행 순서

### Phase 1: 임시 백업 (리뷰안 → MONKOS_USB)

```bash
# 리뷰안 전체를 MONKOS_USB에 복사
rsync -avh --progress "/Volumes/리뷰안2T 1/기존백업" /Volumes/MONKOS_USB/리뷰안_대피/
rsync -avh --progress "/Volumes/리뷰안2T 1/백업2" /Volumes/MONKOS_USB/리뷰안_대피/
rsync -avh --progress "/Volumes/리뷰안2T 1/최근백업" /Volumes/MONKOS_USB/리뷰안_대피/
rsync -avh --progress "/Volumes/리뷰안2T 1/iMac_archive" /Volumes/MONKOS_USB/리뷰안_대피/
rsync -avh --progress "/Volumes/리뷰안2T 1/api" /Volumes/MONKOS_USB/리뷰안_대피/
```

### Phase 1 검증

```bash
# 파일 수 비교
echo "리뷰안 원본:"
find "/Volumes/리뷰안2T 1/" -type f | wc -l
echo "MONKOS_USB 복사본:"
find /Volumes/MONKOS_USB/리뷰안_대피/ -type f | wc -l

# 용량 비교
du -sh "/Volumes/리뷰안2T 1/"
du -sh /Volumes/MONKOS_USB/리뷰안_대피/
```

⚠️ **파일 수와 용량이 일치하지 않으면 Phase 2 진행 금지.**

### Phase 2: 리뷰안 포맷 (작가님 직접 실행)

> ⚠️ 이 단계는 **작가님이 직접 실행**합니다. 데이터가 완전 삭제됩니다.

1. 디스크 유틸리티 실행 (응용 프로그램 → 유틸리티 → 디스크 유틸리티)
2. 왼쪽에서 **리뷰안2T** 물리 디스크 선택 (파티션이 아닌 최상위)
3. **지우기** 클릭
4. 설정:
   - 이름: `리뷰안2T`
   - 포맷: **APFS**
   - 체계: GUID 파티션 맵
5. **지우기** 실행

### Phase 3: Time Machine 세팅 (작가님 직접 실행)

1. 시스템 설정 → 일반 → Time Machine
2. 백업 디스크 추가 → **리뷰안2T** 선택
3. 암호화: 선택 (켜면 암호 설정 필요)
4. 디스크 사용 제한: 없음
5. **완료** → 첫 백업 자동 시작

### Phase 3 검증

```bash
# Time Machine 상태 확인
tmutil status
# 백업 디스크 확인
tmutil destinationinfo
```

### Phase 4: 하드 재정리 (대피 데이터 분류)

MONKOS_USB에 대피한 리뷰안 데이터를 분류하여 최종 배치:

| 대피 데이터 | 용량 | 최종 위치 | 근거 |
|------------|------|----------|------|
| **iMac_archive/monk_assets** | ? | 검토 후 판정 — 워크벤치(MONKOS_ASSETS) or LaCie | 서비스 에셋이면 워크벤치, 레거시면 LaCie |
| **iMac_archive/촬영_archive** | ? | **LaCie** | 개인 촬영 원본 = 냉장 보관 |
| **iMac_archive/lightroom** | ? | **LaCie** | 사진 라이브러리 = 냉장 보관 |
| **iMac_archive/photos** | ? | **LaCie** | 개인 사진 = 냉장 보관 |
| **iMac_archive/ai_sessions** | ? | 검토 필요 — 프로젝트 corpus/ 가치 or 폐기 |
| **기존백업** (촬영, 부동산 등) | 70 GB | **LaCie** | 개인 아카이브 = 냉장 보관 |
| **백업2** (촬영물 잔여) | 53 GB | **LaCie** | 개인 아카이브 = 냉장 보관 |
| **최근백업** | 72 GB | 검토 — iMac 현행과 중복이면 폐기 |

#### Phase 4 실행

```bash
# 1) 촬영/개인 데이터 → LaCie
rsync -avh --progress /Volumes/MONKOS_USB/리뷰안_대피/기존백업 /Volumes/LaCie/리뷰안_아카이브/
rsync -avh --progress /Volumes/MONKOS_USB/리뷰안_대피/백업2 /Volumes/LaCie/리뷰안_아카이브/
rsync -avh --progress /Volumes/MONKOS_USB/리뷰안_대피/iMac_archive/촬영_archive /Volumes/LaCie/리뷰안_아카이브/
rsync -avh --progress /Volumes/MONKOS_USB/리뷰안_대피/iMac_archive/lightroom /Volumes/LaCie/리뷰안_아카이브/
rsync -avh --progress /Volumes/MONKOS_USB/리뷰안_대피/iMac_archive/photos /Volumes/LaCie/리뷰안_아카이브/

# 2) 검토 대상은 대피 위치에 유지 (작가님 판단 후 이동)
# - iMac_archive/monk_assets
# - iMac_archive/ai_sessions
# - 최근백업
```

#### Phase 4 완료 후

```bash
# LaCie 이관 검증
du -sh /Volumes/LaCie/리뷰안_아카이브/

# MONKOS_USB 대피 잔여 확인 (검토 대상만 남아야 함)
du -sh /Volumes/MONKOS_USB/리뷰안_대피/*/
```

## 3. 최종 상태 (목표)

| 드라이브 | 역할 | 내용물 |
|----------|------|--------|
| **리뷰안2T** | iMac 활성 확장 디스크 | Time Machine + (향후) 활성 작업 아카이브 |
| **LaCie 메인** | 냉장 아카이브 | 개인 촬영 + 리뷰안 레거시 통합 |
| **MONKOS_USB** | 이동/시연/임시 | 대피 잔여(검토 대상) → 판정 후 정리 |
| **iMac 내장** | 워크스테이션 | OS + 프로젝트 + Desktop(MONKOS_ASSETS 심링크) |

## 4. ⚠️ 준수 조항

- **헌법 4조 2항**: Phase 2(포맷)는 작가님 직접 실행. 막내가 `diskutil eraseDisk` 실행 금지.
- **Phase 1 검증 통과 전 Phase 2 진행 금지**: 파일 수·용량 불일치 시 즉시 보고.
- **rsync --delete 금지**: 복사만, 삭제 없음. 원본은 작가님이 직접 포맷으로 삭제.
- **LaCie 기존 데이터 보존**: `/Volumes/LaCie/리뷰안_아카이브/` 새 폴더에만 쓰기.

## 5. 보고 형식

```
✅ Phase 1: 임시 백업 완료 (파일 X/X 일치, Y GB)
⏳ Phase 2: 작가님 포맷 대기
✅ Phase 3: Time Machine 세팅 완료 (첫 백업 진행 중)
✅ Phase 4: 하드 재정리 — LaCie 이관 Z GB, 검토 대상 W GB 잔여
📁 최종 상태: 리뷰안(TM 전용) / LaCie(아카이브) / MONKOS_USB(임시)
```
