#!/bin/bash
# A안(whisper·고정 간격 프레임) · B안(유튜브 자동 자막·장면 전환 감지) — 같은 구간 (PF_GO, 11-05 21:52)
# 사용: run_ab.sh VIDEO_ID 시작초 끝초   → ~/.monkos/go-commentary-yt/cmp/<ID>_<시작>/ (레포 밖)
# 무로그인·쿠키 없음. 다운로드는 지정 구간만. 내부 연구 전용.
set -e
VID=$1; S=$2; E=$3
HERE=$(cd "$(dirname "$0")" && pwd)
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
D=$HOME/.monkos/go-commentary-yt/cmp/${VID}_${S}
mkdir -p "$D/frames_a"
URL="https://www.youtube.com/watch?v=$VID"
log() { echo "$(date '+%H:%M:%S') $*" | tee -a "$D/run.log"; }
log "구간 $S~$E초 받기"
t0=$(date +%s)
python3 -m yt_dlp -q --ffmpeg-location "$FF" -f "bestaudio[ext=m4a]/bestaudio" --download-sections "*$S-$E" -o "$D/audio.%(ext)s" "$URL"
python3 -m yt_dlp -q --ffmpeg-location "$FF" -f "bv*[height<=480][ext=mp4]/bv*[height<=480]" --download-sections "*$S-$E" -o "$D/video.%(ext)s" "$URL"
python3 -m yt_dlp -q --skip-download --write-info-json --write-auto-subs --sub-langs ko --sub-format json3 -o "$D/info" "$URL" || log "⚠️ 자동 자막 없음"
log "받기 $(( $(date +%s) - t0 ))초"
[ -f "$D/audio.m4a" ] || { A=$(ls "$D"/audio.* | head -1); "$FF" -loglevel error -y -i "$A" -c:a aac "$D/audio.m4a"; }
# A 대본
t1=$(date +%s); python3 "$HERE/transcribe.py" "$D" > "$D/a_transcribe.log" 2>&1; log "A whisper $(( $(date +%s) - t1 ))초"
# A 장면: 10초 고정 간격
"$FF" -loglevel error -y -i "$D/video.mp4" -vf fps=1/10 "$D/frames_a/f_%04d.jpg"; log "A 프레임 $(ls "$D/frames_a" | wc -l | tr -d ' ')장"
# B 장면: 장면 전환(scene > 0.25) 시각
"$FF" -i "$D/video.mp4" -vf "select='gt(scene,0.25)',showinfo" -f null - 2> "$D/b_scene.log" || true
grep -o 'pts_time:[0-9.]*' "$D/b_scene.log" | cut -d: -f2 > "$D/b_scene_times.txt"; log "B 장면 전환 $(wc -l < "$D/b_scene_times.txt" | tr -d ' ')회"
log "끝"
