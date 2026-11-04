# select_recorder — 맥북 셀렉 기록기

> 꾸 맥북(캡처원 23)에 약 3주 남아 있는 촬영 원본을 512px 축소본으로 만들고, 시놀로지 촬영접수 폴더와 파일명을 대조해 셀렉 정답 매니페스트를 쌓는다.
> 설계 상위: `monkos-ops/tech/designs/2026-11/DESIGN_20261103_IDPHOTO_사진판별시스템_학습로드맵.md` P5(컷 선택).
> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내4_IDPHOTO_맥북셀렉기록기_1차회수.md`

## 구성

| 파일 | 실행 위치 | 역할 |
|---|---|---|
| `collect_mac.sh` | 맥북 (ssh로 stdin에 넣어 실행) | `meta` 메타 TSV / `thumbs` 512px JPEG을 tar로 출력. bash·sips·sqlite3·stat만 씀 |
| `build_manifest.py` | iMac | `todo` 증분 대상 / `build` 축소본 배치·셀렉 대조·묶음·매니페스트 병합·검증 리포트 |
| `run_collect.sh` | iMac | 위 둘을 묶은 1회 실행기(증분·재실행 안전) |
| `ai.monkos.select-recorder.plist.example` | (설치 안 함) | 매일 자동 실행 설치안 — 승인 게이트 대상 |

## 실행

```bash
# iMac (시놀로지 촬영접수·작업백업 마운트 상태)
AI_Factory/select_recorder/run_collect.sh            # 회수
AI_Factory/select_recorder/run_collect.sh --dry-run  # 매니페스트·축소본 쓰지 않음(축소본 전송은 함)
AI_Factory/select_recorder/run_collect.sh --limit 5  # 스모크
```

환경변수: `SELREC_HOST`(기본 `mac@100.92.201.83`, 맥북 Tailscale — LAN 172.30.1.26), `SELREC_DEST`(기본 `/Volumes/작업백업/_select_dataset`), `SELREC_INTAKE`(기본 `/Volumes/촬영접수/2026년_작업`), `SELREC_BATCH`(기본 40), `SELREC_REPORT_OUT`(리포트 사본 경로).

접속: iMac 키 인증 `ssh mac@100.92.201.83`. 맥북 macOS 13.7.8, 상시 전원.

## 맥북 쪽 규칙 (꾸 기기)

- **python3 호출 금지** — 맥북에 없고 부르면 개발자 도구 설치 창이 뜬다.
- 쓰기는 `/tmp/selrec.XXXXXX` 하나뿐이고 종료 시(trap) 지운다. 실행 뒤 `ls -d /tmp/selrec.*` 0건이어야 정상.
- 캡처원 카탈로그 DB는 `/tmp` 복사본으로만 읽는다. 카탈로그·세션·설정(.cos)은 읽기만 한다. 캡처원이 실행 중이어도 상관없다.
- 패키지·도구 설치 금지.

## 데이터 위치·형식

```
/Volumes/작업백업/_select_dataset/
  YYYY-MM/                 ← 촬영 월(KST)
    thumbs/<원본 이름>.jpg  ← sips -Z 512, JPEG 품질 80, 센서 방향 그대로(아래 회전 참조)
    manifest.jsonl         ← 1컷 1행
  _runs/report_YYYYMMDD_HHMMSS.json  ← 실행별 검증 리포트
```

`manifest.jsonl` 필드: `file`, `shot_at`(KST ISO), `rating`(별점 — 작가님), `color_tag`·`color_name`(색 태그 — 꾸, 캡처원 색 번호 1=red … 5=blue), `selected`, `selected_keys`, `customer_key`(묶음이 배정된 고객 `YYYYMMDD_NNN`), `purpose`(고객 폴더 괄호 안 용도), `group_id`, `group_conf`(high/medium/low/none), `trashed`(캡처원 휴지통 컷), `c1_rotation`, `thumb_rotation_applied`, `source`(`catalog:이름`/`session:이름`), `relpath`(맥북 촬영본 기준), `thumb`.

- **증분**: 축소본이 이미 `_select_dataset/*/thumbs/`에 있으면 다시 만들지 않는다. 축소본은 새 파일만 복사(덮어쓰기·삭제 없음).
- **매니페스트 병합**: 맥북에서 이미 지워진 과거 컷 행은 보존, 지금 맥북에 있는 컷 행은 새 값(별점·색·셀렉·묶음)으로 갱신. 당일 촬영 중 실행해도 나중 재실행이 셀렉을 반영한다.
- **개인정보**: 축소본·매니페스트는 시놀로지 사내 보관만. 레포·외부 전송 금지. 리포트는 고객 이름 없이 `customer_key`만 쓴다(매니페스트도 이름 열 없음).

## 정답 정의 (작가님 2026-11-04 17:28)

- **셀렉 = 그 CR3 파일명이 촬영접수 고객 폴더(`YYYYMMDD_NNN_…`)에 있다.** 파일명 접두사는 캡처원 세션·카탈로그 이름이라 촬영일과 다르다(예: 세션 `20261028`이 11-04까지 이어짐) → 날짜가 아니라 **전역 파일명**으로 대조한다. 비교 전 한글 NFC 정규화(시놀로지 SMB 경로는 NFD가 섞임).
- 별점(작가님)·색 태그(꾸)는 **중간 선호 신호** — 정답이 아니라 보조 열.

## 촬영 시각

카메라 EXIF 시각은 카메라 시계가 약 2.9년 어긋나 있다. 맥북 원본 파일 생성 시각(테더 수신 시각, `stat -f %B`)과 EXIF의 차는 출처별로 상수이고 편차는 ±3초(2026-11-04 실측, 903컷) → **파일 생성 시각을 `shot_at` 정본**으로 쓴다.

## 묶음 규칙 (사람 묶음)

1. 촬영 시각순으로 정렬, **같은 날 + 앞 컷과 간격 ≤ 120초**면 같은 구간.
2. 구간 안 셀렉 앵커의 고객이 1명 → 그 고객 묶음, `high`.
3. 2명 이상 → 서로 다른 고객 앵커 사이에서 간격이 가장 큰 지점에서 자른다, `low`.
4. 셀렉 앵커 없는 구간 → `YYYYMMDD_uNN`, `none`(고객 미배정 — 당일 미전달, 테스트 컷, 셀렉 없는 촬영 등).
5. 같은 고객이 인접 구간으로 갈렸으면 병합, `medium`(한쪽이 low면 low). 떨어진 구간에 다시 나오면 `KEY#2`, `low`.

**120초 근거(2026-11-04, 903컷, 같은 날 연속 간격 분포)**: ≤90초 818건 → 90~120초 3건으로 급감(골) → 120초 초과 64건(고객 교대·대기). 임계 민감도: 60초는 미배정 86컷(한 사람 촬영이 쪼개짐), 180·300초는 `low`(2인 이상 구간)가 14·20개로 증가. 120초에서 미배정 15컷·`low` 6, 증명류 묶음 중앙값 10컷(작가님 "한 사람 10여 컷"과 일치). `--gap`으로 바꿀 수 있다.

## 축소본 회전

원본 CR3에 방향 태그가 없다(`sips -g orientation` = nil). 캡처원 회전값은 설정에만 있다(세션 `.cos` `Rotation`=270, 카탈로그 `ZVARIANTLAYER.ZROTATION`). 축소본은 **센서 방향 그대로(가로 512×341)** 저장하고 `c1_rotation`을 매니페스트에 남긴다(`thumb_rotation_applied: 0`). 회전 방향 규약(270이 시계/반시계 중 무엇인지)은 이번 범위 밖이다 — 다음 단계(얼굴 랜드마크)에서 c1_rotation 적용본·반대 방향본 중 얼굴이 검출되는 쪽으로 자동 판정한다(쌍아 11-04 17:37). 1차 회수 실측: 913컷 중 912컷 270°, 1컷 0°.

## 실측 (1차 회수 2026-11-04)

- 전량 905컷 28분(≈1.9초/컷, 40컷 배치 ssh), 증분 재실행 8컷 33초. 축소본 평균 ≈21KB — 913컷 19.7MB(하루 약 1MB).
- 실패 가시화: 수집 단계 `❌ collect_mac:`, 실행기 `❌ run_collect:` + exit≠0(축소본 실패 시 exit 3), 메타 값 범위 이탈(별 0~5·색 0~7·휴지통 0/1 밖) 시 `❌ build_manifest: … 열 밀림 의심` — 음성 대조군(구 TSV 433행 열 밀림) 거부 실증.

## 알려진 한계

- 셀렉 파일이 고객 폴더로 옮겨지기 전에 실행하면 그날 컷은 미배정(`none`)으로 남는다 → 다음 실행이 갱신.
- 고객 폴더에 CR3가 없는 건(복원·외부 사진 등)은 정답이 없다 — 리포트 `folders_without_cr3`.
- 맥북 보관 ≈3주. 그 이전 촬영본은 이미 지워져 회수 불가.
