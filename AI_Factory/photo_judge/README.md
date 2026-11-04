# photo_judge — 사진 판별 학습 매니페스트 (P0)

> 설계 상위: `monkos-ops/tech/designs/2026-11/DESIGN_20261103_IDPHOTO_사진판별시스템_학습로드맵.md` §3 P0 · §8
> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내5_IDPHOTO_사진판별P0마무리.md`
> 결과 보고: `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내5_IDPHOTO_사진판별P0.md`

시놀로지 두 공유(`촬영접수` 원본 · `작업백업` 하남 완성본)를 고객 키 `YYYYMMDD_NNN`으로 짝지어, 고객 1명 = JSONL 1행의 **가명화 매니페스트**를 만든다. 시놀로지는 읽기만 한다. stdlib + (정합 시험만) numpy·PIL·cv2, 신규 설치 없음.

## 구성

| 파일 | 역할 | 시놀로지 접근 |
|---|---|---|
| `scan_listing.py` | 두 공유 파일 목록·크기·수정시각 스캔 → `listing.tsv` | 목록만 (~70초) |
| `build_manifest.py` | 분류 규칙 → 고객 레코드 → `manifest_v0.jsonl`·`pathmap.jsonl` + §8-3 재현표 | `--xmp` 때만 .xmp 본문(크롭 필드) |
| `xmp_probe.py` | .xmp 크롭 필드 표본 10건 표 + 전수 분포 | 표본 10개 .xmp |
| `register_pairs.py` | 하남 RAW ↔ 규격 완성 JPG 정합 50쌍 + 사이드카 대조 | 표본 이미지만 |
| `gundae_register.py` | 건대 RAW ↔ `출력용` JPG 정합 소표본 | 표본 이미지만 |
| `gundae_rules.py` | 건대 월별 파일명 패턴 + 표본 치수(mm) 집계 | 표본 JPG 헤더 |
| `gate_table.py` | P0 게이트 재료 표 | 없음 |

## 실행

```bash
# 시놀로지 마운트 상태(/Volumes/촬영접수 · /Volumes/작업백업)
python3 AI_Factory/photo_judge/scan_listing.py                 # → ~/.monkos/photo_judge/listing.tsv
python3 AI_Factory/photo_judge/build_manifest.py --xmp         # → manifest_v0.jsonl · pathmap.jsonl (+재현표 stdout)
python3 AI_Factory/photo_judge/build_manifest.py --dry-run     # 표만 (쓰기 없음, .xmp 미파싱)
python3 AI_Factory/photo_judge/xmp_probe.py
python3 AI_Factory/photo_judge/register_pairs.py -n 50         # ~10분 · → register_v0.jsonl
python3 AI_Factory/photo_judge/gundae_register.py -n 10
python3 AI_Factory/photo_judge/gate_table.py
```

산출은 전부 **레포 밖** `~/.monkos/photo_judge/`(권한 700/600). 레포 안 경로를 산출로 주면 `build_manifest.py`가 거부한다.

| 파일 | 내용 | 반출 |
|---|---|---|
| `listing.tsv` | 실제 경로(고객 이름 포함) | ❌ 이 기기 밖 금지 |
| `pathmap.jsonl` | 가명 id·path_ref → 실제 경로 | ❌ 학습 기기 안에만 |
| `salt` | 가명화 솔트(내부용, 외부 서비스 키 아님) | ❌ 값 출력·기록 금지 |
| `manifest_v0.jsonl` | 가명 레코드(이름·폴더명 없음) | 학습 기기 간 이동 가능(작가님 결정 범위) |
| `register_*.jsonl` | 가명 id·수치 | 〃 |
| `tmp/` | 표본 현상본 — 실행 끝에 자동 삭제 | ❌ |

## 가명화

- `id` = `c_` + SHA-256(솔트 + ":" + `YYYYMMDD_NNN`) 앞 16자. 솔트는 처음 실행 때 `secrets.token_hex(32)`로 `~/.monkos/photo_judge/salt`(600)에 만들고 다시 쓴다 — 솔트가 바뀌면 id가 전부 바뀐다(학습 분할이 흔들리므로 지우지 말 것).
- 날짜는 `YYYY-MM`까지. 이름·폴더명·파일명은 매니페스트에 없다. `purpose`는 폴더 `(용도)`를 `+`로 나눈 토큰 중 한글·영숫자 12자 이하이고 `님`이 없는 것만.
- 파일 위치는 레코드 안 `path_ref`(`r1` RAW · `x1` 사이드카 · `m1` 마스터 · `f1` 규격 · `s1` 서비스)로만 가리키고, 실제 경로는 `pathmap.jsonl`에만 있다.

## 분류 규칙 (파일명·확장자만 — 위에서부터 먼저 맞는 것)

1. `.cr2 .cr3 .dng` → `raw`
2. `.xmp .acr .cos .cop .cof .cot .comask` → `sidecar` (`.xmp`는 같은 이름 RAW와 `for`로 연결)
3. 이미지 아닌 것 → `other`
4. 이름에 `nR(` · `인화` · `4x6` · `5x7` → `print_layout` (인화 배치판)
5. 이름에 `보정전` → `before_retouch`
6. `.psd .psb` → `psd_work` / `.tif .tiff` → `master_tif`
7. JPG·PNG: `님` 뒤 꼬리에 `sv`(대소문자 무관) → `service_sv`
8. 이름에 `출력용` → `spec_final`(src `gundae_print`) / `웹용` → `spec_final`(src `gundae_web`) — **건대 규칙**
9. `님` 뒤 꼬리에 규격 용도 토큰(여권·증명·민증·운전·민증운전·운전민증·면허·비자류·사원증·이력서·수능·학생증·자격증·수험·공무원·여민·고증·여증·이패·프증) → `spec_final`(src `named`)
10. `프로필` → `profile` (증명 규격 아님 — 별도) / 나머지 → `other_img`
11. 보조: 고객에 규격 완성이 하나도 없고 폴더 `(용도)`가 규격이면, 번호만 붙은 완성 JPG(`이름님_01`·`이름님`)를 `spec_final`(src `folder_inferred`)로 올린다.

`spec_conf` = `high`(named 있음) · `medium`(건대 출력용·웹용만) · `low`(folder_inferred만).

**시대 경계** `HANAM_FROM = 20240601`: 촬영접수의 `출력용·웹용` 보유 고객이 2024-05 94/98 → 2024-06 0/115로 끊기고, 같은 달부터 작업백업의 `이름님_{용도}`가 시작된다(`gundae_rules.py` 월별 표).

두 공유에 같은 파일(이름·크기 동일, 하남 CR3 사본 등)은 한 번만 센다.

## 정합 성공 기준 (실행 전 고정)

SIFT(CLAHE 전처리) + 비율 검사 0.8 + RANSAC 닮음변환(재투영 임계 3px@축소본). RAW는 `sips`로 긴 변 2400px 현상, 마스터 TIF는 1400px 축소, 오차는 **원본 px로 환산**.

- inlier ≥ 15 · inlier 비율 ≥ 0.20 · inlier 재투영 오차 중앙값 ≤ 6px(원본) · 상자 네 모서리가 원본 프레임 안(여유 3%) · 배율 정상
- 기울기 NCC는 독립 확인용으로 기록만(판정에 안 씀).

RAW 현상에 `sips`를 쓴 근거: macOS 13 RAW 엔진이 CR3(EOS R8)·CR2를 전 해상도로 디코드한다(11-04 실측 6000×4000, 2.3초). 내장 미리보기 JPEG 추출은 기종별 미리보기 해상도·여백이 달라 좌표 환산이 흔들리고 별도 파서가 필요하다.

## 사이드카 `.xmp` 크롭 해석

`crs:CropLeft/Top/Right/Bottom`은 0~1 정규 좌표이고, **회전 전 센서 프레임**(6000×4000 가로) 기준이다(`tiff:Orientation` 8이 표시 회전). (Left,Top)·(Right,Bottom)은 회전된 크롭 사각형의 **대각 꼭짓점**이며 변 방향이 `CropAngle`이다 — 축정렬 사각형으로 읽으면 각도만큼 변 길이가 어긋난다. 이 크롭은 **규격 상자가 아니라 마스터 TIF(정사각 3300×3300 등) 프레임**이다. 규격 상자는 마스터 안에서 한 번 더 잘린다.

11-04 50쌍 실측: 0이 아닌 각도 38건 중 대각 해석(`diag+`)이 34건 최적, 각도 0인 10건은 세 해석이 같다. 정합으로 잰 마스터 프레임과 꼭짓점 평균오차는 p50 24.5px · p90 69.1px(원본, 프레임 변 ≈3,000px의 약 1%·2%)다. 사이드카는 **마스터 프레임의 근사 사전값**이고, 규격 상자를 px 단위로 얻으려면 정합이 필요하다. 매니페스트 `sidecar[].crop`·`angle`·`orientation`에 원값을 담는다(해석은 사용 측이 `diag+`로).

## §8-3 재현표 (11-04, v0 규칙)

| 연도 | 고객 | RAW | 사이드카 | 마스터 TIF | 규격 완성 | sv | RAW+규격 | RAW+규격+sv | RAW+사이드카 | 규격∪프로필 |
|---|---|---|---|---|---|---|---|---|---|---|
| 2018 | 7 | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 7 | 0 |
| 2019 | 13 | 13 | 3 | 0 | 11 | 0 | 11 | 0 | 3 | 12 |
| 2023 | 1,020 | 943 | 21 | 1 | 932 | 0 | 857 | 0 | 21 | 944 |
| 2024 | 2,545 | 2,541 | 881 | 1,689 | 2,260 | 1,620 | 2,256 | 1,605 | 879 | 2,311 |
| 2025 | 2,563 | 2,557 | 2,522 | 2,554 | 2,459 | 2,450 | 2,455 | 2,431 | 2,518 | 2,501 |
| 2026 | 1,012 | 1,009 | 776 | 710 | 724 | 696 | 724 | 682 | 776 | 744 |
| **합계** | **7,160** | 7,070 | 4,210 | 4,954 | 6,386 | 4,766 | **6,303** | 4,718 | 4,204 | 6,512 |

11-03 실측(합계 고객 7,130 · RAW+규격 5,127)과 다른 이유는 세 가지다.
1. 건대 `출력용·웹용`을 규격으로 편입했다. 2023 규격 완성은 160명에서 932명이 됐다(11-03의 160은 `여권_출력용`처럼 용도 토큰이 붙은 파일만 센 것으로 추정한다). 2024 1~5월분도 같은 이유로 늘었다.
2. 프로필은 증명 규격에서 뺐다. 2025는 규격 2,459 vs 11-03 2,513이고, 규격∪프로필은 2,501로 차이가 12명이다.
3. 11-03 표에 없던 2018·2019 키 20명이 들어갔다. 2026은 10명 늘었는데, 스캔 시점 차이(월 단위 이관)로 본다.

## 다음 (P1)

- 매니페스트 `raw.w/h`·`spec_final.wh`·`crop_in_raw`는 v0에서 비어 있다 — P1 파이프라인(현상·정합)에서 채운다.

## 여권 화각 산식 vs 출고본 대조 (11-04, ORDER_20261104 막내7)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내7_IDPHOTO_여권화각_출고본대조.md` · 결과: `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내7_IDPHOTO_여권화각_출고본대조.md`

| 파일 | 역할 |
|---|---|
| `fov_compare.py` | 표본 선정(하남·named 여권·35:45·월 층 순환·시드 1104) → RAW 현상(긴 변 2048) → 정합 A → 90° 단위로 세움 → 산식 측정 → 출고·산식 지표 → `fov_compare_v0.jsonl` |
| `fov_formula.mjs` | 포털 정본 `hair-measure.js`·`fit-fov.js`를 import해 precheck 여권 경로(검출 → `computeFitGeometry` → 512 매팅 머리끝 → `resolveHeadPlacement`)를 재현. stdin/stdout JSON 1줄 |
| `fov_summary.py` | 집계 표(지표 분포·판정·오판 후보·반대 사례·연도별) |

로컬 전제(고객 픽셀은 이 기기 밖으로 나가지 않는다 — 헬퍼가 127.0.0.1 외 주소를 거부):

```bash
# 워크트리면 node_modules·onnx는 본 체크아웃으로 심볼릭 링크(커밋 금지)
# 1) crop-engine 로컬 (SCRFD + 106점, 설치 0 — onnxruntime·cv2·numpy 기존)
(cd monkos_AI/crop-engine && PORT=8093 SCRFD_PORT=5093 node server.js) &
# 2) 매팅 — prod 1순위(matte-imac)와 같은 vision-matte 바이너리를 측정 전용 포트로. 시크릿 미주입 = 인증 생략, 루프백만
PORT=8097 MATTE_HOST=127.0.0.1 ~/.monkos/vision-matte/vision-matte &
# 3) 실행 (~10초/건)
python3 AI_Factory/photo_judge/fov_compare.py -n 200        # CROP_URL·MATTE_URL 환경변수로 포트 변경
python3 AI_Factory/photo_judge/fov_summary.py
```

- 측정 원칙: 랜드마크(눈·턱·거울상 정수리)와 머리끝(512 매팅 덩어리 끝)은 원본에서 1회 재고, 출고 틀·산식 틀 양쪽에 같은 값을 쓴다. 출고 틀 지표는 정합 A의 역변환으로 점을 규격 JPG 좌표에 옮겨 잰다(기울기 반영).
- 산식 `no_room`은 판정 프레임이 원 프레임이라, 지표는 산식이 시도한 최선 틀(재배율 + 눈 48%)로 낸다.
- "크게 다름"(실행 전 고정): |Δ두상| ≥ 1.5mm · |Δ눈| ≥ 3.0%p · |Δ머리 위 여백| ≥ 1.5mm.
- `computeFitGeometry`는 server.js 비export 함수라 헬퍼에 이식했다 — server.js가 바뀌면 대조 후 갱신. kr-passport 규격 입력은 `specs-data.json`과 대조해 다르면 기동을 거부한다(spec-crop.js는 config.js의 PROJECT_ID 필수라 로컬 import 불가).
