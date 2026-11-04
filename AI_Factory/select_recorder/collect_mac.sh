#!/bin/bash
# collect_mac.sh — 꾸 맥북(캡처원 촬영본)에서 실행되는 수집기. bash·sips·sqlite3·stat만 쓴다.
# ⚠️ python3 호출 금지(맥북에 없음 — 개발자 도구 설치 창 유발). 쓰기는 /tmp 임시 디렉터리만, 종료 시 삭제.
# 캡처원 카탈로그·세션·설정은 읽기만 한다(카탈로그 DB는 /tmp 복사본으로 읽음).
#
# 사용(iMac에서 run_collect.sh가 호출 — 직접 실행 시):
#   ssh mac@HOST "bash -s -- meta"             < collect_mac.sh  → 메타 TSV (stdout)
#   ssh mac@HOST "bash -s -- thumbs <B64LIST>" < collect_mac.sh  → 512px JPEG tar (stdout)
#     B64LIST = base64(줄바꿈 구분 상대경로 목록, ROOT 기준)
#
# 메타 TSV 열: file relpath source kind birth_epoch exp_epoch rating color_tag trashed c1_rotation
#   c1_rotation = 캡처원 회전값(도). 원본 CR3엔 회전 태그가 없어 축소본은 센서 방향 그대로다.
#   source = 카탈로그/세션 이름, kind = catalog|session,
#   birth_epoch = 파일 생성 시각(테더 수신 ≈ 촬영 실시각),
#   exp_epoch = 카메라 EXIF 시각(카메라 시계 기준 — 오프셋 보정은 iMac build_manifest에서)
set -u
ROOT="${SELREC_ROOT:-$HOME/Desktop/촬영본}"
MODE="${1:-}"
TMP=$(mktemp -d /tmp/selrec.XXXXXX) || { echo "❌ collect_mac: mktemp 실패" >&2; exit 1; }
cleanup() { find "$TMP" -mindepth 1 -delete 2>/dev/null; rmdir "$TMP" 2>/dev/null; }
trap cleanup EXIT

die() { echo "❌ collect_mac: $*" >&2; exit 1; }
[ -d "$ROOT" ] || die "촬영본 루트 없음: $ROOT"

xml_max() { # $1=cos 파일, $2=키 → 모든 레이어 값 중 최댓값(없으면 빈 값)
  grep -o "K=\"$2\" V=\"[0-9]*\"" "$1" 2>/dev/null | sed 's/.*V="\([0-9]*\)"/\1/' | sort -n | tail -1
}

meta() {
  printf 'file\trelpath\tsource\tkind\tbirth_epoch\texp_epoch\trating\tcolor_tag\ttrashed\tc1_rotation\n'
  # 1) 카탈로그 — DB는 /tmp 복사본으로만 읽는다
  for cat in "$ROOT"/*.cocatalog; do
    [ -d "$cat" ] || continue
    name=$(basename "$cat" .cocatalog)
    db="$cat/$name.cocatalogdb"
    [ -f "$db" ] || die "카탈로그 DB 없음: $db"
    cp "$db" "$TMP/c.db" || die "카탈로그 DB 복사 실패: $db"
    for ext in -wal -shm; do if [ -f "$db$ext" ]; then cp "$db$ext" "$TMP/c.db$ext"; fi; done
    # 구분자는 '|' — 탭은 IFS 공백 문자라 빈 칸(별점·색 없음)이 합쳐져 열이 밀린다(11-04 실측 버그)
    sqlite3 -separator '|' "$TMP/c.db" "
      SELECT i.ZIMAGEFILENAME, p.ZRELATIVEPATH, i.ZEXP_DATE, IFNULL(i.ZISTRASHED,0),
             IFNULL(MAX(m.ZBASIC_RATING),''), IFNULL(MAX(m.ZCOLOR_TAG_INDEX),''),
             IFNULL(MAX(l.ZROTATION),'')
      FROM ZIMAGE i
      LEFT JOIN ZPATHLOCATION p ON p.Z_PK = i.ZIMAGELOCATION
      LEFT JOIN ZVARIANT v ON v.ZIMAGE = i.Z_PK
      LEFT JOIN ZVARIANTLAYER l ON l.ZVARIANT = v.Z_PK
      LEFT JOIN ZVARIANTMETADATA m ON m.Z_PK = l.ZMETADATA
      GROUP BY i.Z_PK;" > "$TMP/cat.tsv" || die "카탈로그 쿼리 실패: $db"
    find "$TMP" -maxdepth 1 -name 'c.db*' -delete
    while IFS='|' read -r f rel exp tr rt ct rot; do
      path="$cat/$rel/$f"
      if [ -f "$path" ]; then birth=$(stat -f %B "$path"); else birth=""; fi
      printf '%s\t%s\t%s\tcatalog\t%s\t%s\t%s\t%s\t%s\t%s\n' "$f" "$(basename "$cat")/$rel/$f" "$name" "$birth" "$exp" "$rt" "$ct" "$tr" "$rot"
    done < "$TMP/cat.tsv"
  done
  # 2) 세션 (Capture = 현행 컷, Trash = 휴지통 컷)
  for ses in "$ROOT"/*/; do
    ses=${ses%/}; name=$(basename "$ses")
    case "$name" in *.cocatalog) continue;; esac
    for sub in Capture Trash; do
      dir="$ses/$sub"; [ -d "$dir" ] || continue
      tr=0; [ "$sub" = Trash ] && tr=1
      for path in "$dir"/*.CR3 "$dir"/*.cr3; do
        [ -f "$path" ] || continue
        f=$(basename "$path")
        cos=$(ls "$dir"/CaptureOne/Settings*/"$f.cos" 2>/dev/null | head -1)
        rt=""; ct=""; exp=""; rot=""
        if [ -n "$cos" ]; then
          rt=$(xml_max "$cos" Basic_Rating); ct=$(xml_max "$cos" Color_Tag_Index)
          exp=$(grep -o 'K="Exp_Date" V="[0-9.]*"' "$cos" | head -1 | sed 's/.*V="\([0-9.]*\)"/\1/')
          rot=$(grep -o 'K="Rotation" V="[0-9.-]*"' "$cos" | head -1 | sed 's/.*V="\([0-9.-]*\)"/\1/')
        fi
        printf '%s\t%s\t%s\tsession\t%s\t%s\t%s\t%s\t%s\t%s\n' "$f" "$name/$sub/$f" "$name" "$(stat -f %B "$path")" "$exp" "$rt" "$ct" "$tr" "$rot"
      done
    done
  done
}

thumbs() {
  list=$(printf '%s' "${1:-}" | base64 -D 2>/dev/null) || die "목록 디코드 실패"
  [ -n "$list" ] || die "빈 목록"
  mkdir -p "$TMP/out"
  fail=0
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    src="$ROOT/$rel"; f=$(basename "$rel"); dst="$TMP/out/${f%.*}.jpg"
    if [ ! -f "$src" ]; then printf 'FAIL\t%s\tmissing\n' "$rel" >&2; fail=$((fail+1)); continue; fi
    if ! sips -s format jpeg -s formatOptions 80 -Z 512 "$src" --out "$dst" >/dev/null 2>&1 || [ ! -s "$dst" ]; then
      printf 'FAIL\t%s\tsips\n' "$rel" >&2; fail=$((fail+1)); rm -f "$dst"
    fi
  done <<< "$list"
  tar -C "$TMP/out" -cf - . || die "tar 실패"
  printf 'DONE\tfail=%s\n' "$fail" >&2
}

case "$MODE" in
  meta) meta ;;
  thumbs) thumbs "${2:-}" ;;
  *) die "모드 지정 필요: meta | thumbs <B64LIST>" ;;
esac
