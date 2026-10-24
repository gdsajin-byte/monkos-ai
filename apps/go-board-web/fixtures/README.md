# 기보 불러오기 픽스처 (2026-10-24, 쌍아-막내14 — ORDER_20261024 기보감상)

| 파일 | 형식 | 확인하는 것 | 출처 |
|---|---|---|---|
| `even_own_game.sgf` | SGF UTF-8 | 호선 258수 · 따냄 · 결과 B+16.5 | 우리 대국(go-board-web 10-23 기보) |
| `handicap3.sgf` | SGF UTF-8 | HA[3]·AB 치석 · 덤 0.5 · 흑 따냄 1 | 직접 작성 |
| `variations.sgf` | SGF UTF-8 | 변화도 → 메인 라인 6수만, '변화도 제외' 표시 | 직접 작성 |
| `cp949_korean_names.sgf` | SGF CP949(CA[EUC-KR]) | 한글 대국자명(홍길동·김철수)·급단 | 직접 작성 |
| `tygem_numeric_ranks.sgf` | SGF UTF-8 | 타이젬식 숫자 급단 코드 BR[19]·WR[35] → '2단'·'P9단'(10-25 K2) | 직접 작성 — 코드표는 GIB 실기보 21개의 이름 급단·BLV/WLV 짝 실측 |
| `tygem_even_kasho-games.gib` | GIB(타이젬 실파일) | 호선 117수 · 결과 'black wins by resignation' · 덤 GONGJE 65 | [artasparks/kasho-games](https://github.com/artasparks/kasho-games) `tygem-games/2014-11/Kashomon(2D)_uknowy(2D)_201411032204.gib` — MIT, Copyright (c) 2014 Josh Hoak |
| `tygem_euckr_sabaki.gib` | GIB(타이젬 실파일) EUC-KR | 한글 급수·결과(1급 · '흑 시간승') CP949 폴백 | [SabakiHQ/Sabaki](https://github.com/SabakiHQ/Sabaki) `test/gib/euc-kr.gib` — MIT, Copyright (c) 2015-2020 Yichuan Shen |
| `tygem_handicap3_analyze-sgf.gib` | GIB(타이젬 실파일) | 3점 접바둑(INI) 치석 배치 D4·Q16·D16 · 'White Dum(5)' | [9beach/analyze-sgf](https://github.com/9beach/analyze-sgf) `test/examples/t-utf-8.gib` — MIT, Copyright (c) 2021 Hyunrae Cho |

- GIB 3종은 원본 바이트 그대로다(변환·수정 없음). MIT 허가 고지: 위 저작권 표시와 함께, 각 저장소의 LICENSE 전문(MIT)이 적용된다 — "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
- 한글 **대국자명**이 든 타이젬 GIB 실파일은 공개 저장소에서 찾지 못했다(위 EUC-KR 파일은 한글이 급수·결과·대국명에 있다). 작가님 타이젬 기보 1개가 오면 `tygem_*`로 추가한다.
- 검증 방법: `run.sh --test 8766` → 대기실 '기보 불러오기'에 이 폴더 파일을 끌어다 놓기(실사용 8765에 불러오기 금지).
