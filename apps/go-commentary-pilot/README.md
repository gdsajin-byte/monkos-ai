---
type: report
date: 2026-10-23
device: iMac
agent: 쌍아-막내11
status: 파일럿 1차 — 작가님 검수 대기
portfolio: PF_RND
design: monkos-ops/tech/designs/2026-10/DESIGN_20261023_RND_카타고의도해설_소형LLM증류.md
---

# 바둑 해설 교사 비교 파일럿 (설계 §6 P)

**[2026-10-23 11:09 KST]** iMac/쌍아-막내11 → iMac/쌍아

> 출처: 쌍아 세션 간 지시(2026-10-23 10:46 KST 수신) ← 작가님 2026-10-23 10:4x iMac 쌍아 세션 사람 턴 "테스트는 그냥해보고 적정모델을 정하자 소넷이던 하이쿠던".

**검수 시트: [SHEET.html](SHEET.html)** — 국면 그림 + 사실 목록 + 모델별 해설(A·B·C 블라인드) + 3점 척도. 브라우저로 열어 채점 → '결과 복사'.

## 결과 요약

| 모델 | 문장 통과율(모순 0) | 엄격 통과율(인용 태그까지) | 전 문장 통과 응답 | 응답 시간 중앙값 | 문장 수 |
|---|---|---|---|---|---|
| haiku | 100.0% (241/241) | 97.5% | 20/20 | 15.4초 | 241 |
| sonnet | 100.0% (239/239) | 97.1% | 20/20 | 8.7초 | 239 |
| opus | 99.2% (235/237) | 98.7% | 18/20 | 10.5초 | 237 |

- 응답 시간은 `claude -p` 1회(3수준 동시 생성) 벽시계 시간, 3건 병렬 실행. haiku가 가장 느린 것은 첫 배치로 동시 기동된 영향이 섞였을 수 있다(모델 고유 속도로 단정하지 말 것).
- opus 모순 2건: "위쪽 가운데"(아이 수준 쉬운 말 — 사실상 오탐), "중앙 쪽 N7"(좌표→영역 추론은 맞지만 사실 목록에 없는 주장).
- **기계 검증은 세 모델을 거의 가르지 못한다.** 사실 JSON만 주면 셋 다 수치·좌표를 지어내지 않는다. 차이는 문체·설명력에서 나므로 **모델 선택은 작가님 검수(맞는 말·재미·이해) 결과로 정한다.** 비용만 보면 haiku가 압도적(환산 $0.04 vs sonnet $0.33 vs opus $0.67 / 20국면, 구독 차감이라 실청구 아님).

## 파이프라인 (이 폴더)

| 파일 | 역할 |
|---|---|
| `ogs.py` | OGS 공개 API 저속 조회(로그인 없음, 요청 간 2초) |
| `games.json` | 선정 3판 — 입문 20k 대 17k(86수) · 중급 10k 대 11k(238수) · 유단 8d 대 8d(180수) |
| `analyze.py` | KataGo(OpenCL, b18) 1차 전 수 스캔(100 visits) → 실수 선정 → 2차 정밀(400 visits, 소유권 포함) |
| `facts.py` | 사실 추출기 F1~F9 (손익·착점·손익 위치·그룹 상태 전환·응징 수순·최선수 목적·급함 vs 큼·승률·후보 순위) |
| `teacher.py` | 같은 사실로 haiku·sonnet·opus 해설 3수준(아이·아마·유단), 문장마다 `[F#]` 태그 |
| `verify.py` | 검증기 — 모순(무태그·없는 ID·사실에 없는 수치/좌표/영역·영역-집 짝 불일치·급함 판정 불일치) / 인용 불일치 |
| `sheet.py` | 검수 시트 생성 |
| `data/` | 기보 원본·분석·사실·교사 원문 (gitignore) |

재현: `python3 analyze.py scan && python3 analyze.py select 20 && python3 analyze.py deep && python3 facts.py && python3 teacher.py && python3 verify.py && python3 sheet.py`
엔진: `~/.monkos/katago/katago-ocl` (레포 밖, v1.18.2 OpenCL 빌드) + `kata1-b18c384nbt-s9996604416-d4316597426`.

## 한계 (파일럿 판정 전 알아둘 것)

1. **급수대 불균형**: 실수 국면 20개 중 중급 14 · 입문 3 · 유단 3. 입문 대국은 86수로 짧고 초반에 승부가 기울어(둔 쪽 승률 3% 미만·97% 초과 국면 제외 규칙), 유단 대국은 2집 이상 실수가 적다. 균형이 필요하면 입문·유단 대국을 1판씩 추가.
2. **P19는 손실 1.3집** — 1차 스캔(100 visits)에선 2.1집이었으나 정밀 분석에서 2집 미만으로 내려갔다. 기준 미달 1건.
3. **F3 손익 위치**는 소유권 기대값 차이의 집 환산 근사다. 영역은 3×3 고정 분할(귀·변·중앙)이라 실제 '그룹' 단위 서술보다 거칠다.
4. **F4 그룹 상태**는 소유권 평균 ±0.5 경계 — 경계 근처 그룹은 '미정'으로 흔들린다.
5. **F7 급함 vs 큼**은 거리·영역 규칙 판정이고, '손 뺀 경우 PV' 대조(설계 §3)는 아직 미구현.
6. 교사에게 판 이미지를 주지 않았다(텍스트 사실만). 설계 §4의 '판 렌더 이미지(참고)'는 학생 모델 입력과 맞추려고 생략.
7. 검증기는 토큰·짝 대조다. "급한 곳" 외의 해석 문장("우변을 먼저 정리하는 흐름" 등)은 잡지 못한다 → 작가님 '맞는 말' 점수가 최종.

## 데이터 출처·이용 조건 — OGS

- 수집: `https://online-go.com/api/v1/games/{id}` · `/api/v1/players/{id}/games/` 공개 엔드포인트, 로그인·API 키 없음, 요청 간 2초, 총 약 50회(게임 ID 탐색 포함).
- 약관 확인(1회): OGS 이용약관·개인정보처리방침 원문 = `online-go/online-go.com` 저장소 `src/views/docs/legal.tsx`(main, 2026-10-23 조회). 사이트 `/terms-of-service`는 JS 렌더라 원문을 소스에서 확인했다.
  - 비공개 아닌 정보 공유 조항(개인정보처리방침): *"We may share or disclose your non-private, aggregated or otherwise non-personal information, such as your public user profile information, game information (both ongoing and historical), friends, public and game chats, and forum posts."*
  - 콘텐츠 라이선스(사용자 → OGS): *"Online-Go.com does not claim ownership of any Content you submit … you grant Online-Go.com the following worldwide, royalty-free, and non-exclusive license …"* — OGS에 대한 허락이지 제3자 재이용 허락은 아니다.
  - 엔진 사용 제한: *"You can NEVER use Go programs (Leela, Zen, etc.) or neural networks to analyze current ongoing games …"* — **진행 중 대국** 한정. 종료 대국 분석은 해당 없음.
  - 스크래핑·자동 접근·데이터 재배포를 명시적으로 허락하거나 금지하는 조항은 **없다**.
- 판단: 종료된 공개 대국을 저속으로 받아 내부 연구에 쓰는 것은 약관과 충돌하지 않는다. 다만 **제3자 재이용 라이선스가 명시되지 않았으므로**, 증류 데이터셋(설계 §5)을 대량으로 만들거나 외부에 공개할 때는 공개 라이선스가 명시된 기보(막내12 조사의 KGS 등)를 우선하거나 OGS 측 확인이 필요하다. 시트에는 사용자명을 싣지 않았다(급수와 게임 링크만).
