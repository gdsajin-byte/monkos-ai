# 착수음 출처·라이선스

> 수집 2026-10-23 12:37 KST, iMac/쌍아-막내13. 출처: 작가님 12:3x 사람 턴 "웹에서 실제 착수음 몇 개 따오라" (쌍아 전달).
> 전부 **CC0 1.0 (퍼블릭 도메인 헌정)** — 출처 표기 의무 없음. 그래도 추적을 위해 기록한다.
> 라이선스는 각 소리 페이지의 라이선스 링크(`creativecommons.org/publicdomain/zero/1.0/`)를 2026-10-23에 직접 확인했다.

| 파일 | 원본 | 작성자 | 라이선스 | 잘라낸 지점(원본 기준, s) |
|---|---|---|---|---|
| `a_billhails2_{1,2,3}.wav` | [GoStoneSounds.ogg](https://freesound.org/people/billhails2/sounds/588317/) | billhails2 | CC0 1.0 | 0.135 · 1.42 · 2.765 |
| `b_hongsungbock_{1,2,3}.wav` | [baduk2](https://freesound.org/people/Hongsungbock/sounds/840425/) | Hongsungbock | CC0 1.0 | 3.33 · 14.235 · 16.96 |
| `c_mpooman485_{1,2,3}.wav` | [[ MPooman ] Play Go Sounds 2 (SE485)](https://freesound.org/people/MPooman/sounds/668942/) | MPooman | CC0 1.0 | 1.815 · 9.71 · 13.72 |
| `d_mpooman471_{1,2,3}.wav` | [[ MPooman ] Play Go Sounds (SE471)](https://freesound.org/people/MPooman/sounds/664986/) | MPooman | CC0 1.0 | 5.15 · 18.195 · 41.795 |
| `capture_mpooman471.wav` | 위 SE471 | MPooman | CC0 1.0 | 11.66 (돌 여러 개 부딪힘 구간, 0.95초) |

## 가공

- 받은 것: Freesound 공개 미리듣기 MP3(`cdn.freesound.org/previews/…-hq.mp3`) — 로그인 없이 받을 수 있다. 원본 파일 다운로드는 로그인이 필요해서 쓰지 않았다(CC0이라 트랜스코딩본 사용에 제약 없음).
- 처리: macOS `afconvert`로 디코딩 → 타격 시작점 보정(피크에서 거꾸로 무음 지점 탐색, 8ms 앞부터) → 0.35초(따냄 0.95초) 자르기 → 끝 60ms 페이드아웃 → 피크 -1dBFS 정규화 → 22.05kHz 16bit 모노 WAV. 파일당 19KB(따냄 44KB).

## 찾았지만 못 쓴 곳 (기록)

- Wikimedia Commons: 오디오 검색("go stone sound", "baduk stone", "igo stone" 등)에서 바둑돌 소리 없음.
- Freesound `weiqi`, `go board stone`(CC-BY 필터): 결과 0건.
- OpenGameArt·Pixabay: 위 4건으로 후보 수(3~5)를 채워서 이번엔 조회하지 않았다.
