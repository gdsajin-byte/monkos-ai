---
type: completion
date: 2026-11-07
time: 05:47 KST
from: iMac/쌍아-막내1
to: iMac/쌍아
order: ORDER_20261107_iMac쌍아_막내1_GO_해설장면사전_용어임베딩.md (추가 05:01·정정 05:03 — 대화록 정제·분류) · ORDER_20261107_iMac쌍아_막내1_INFRA_발화DB_설계.md (05:21·정정 05:24)
branch: worktree-makne1-go-commentary
portfolio: PF_GO
---

# COMPLETION — 대화록 정제·분류 30편 + 발화·말투 정본 DB v0

**[2026-11-07 05:47 KST]** iMac/쌍아-막내1 → iMac/쌍아

결론: 유튜브 해설 30편 전체를 LLM 주도로 정제·분류했습니다. 결과는 발화 27,387개, 남김 25,645개, Q&A 790쌍이고, 형식 오류와 누락은 0입니다. 이것을 SQLite 발화 DB v0에 적재했고 질의 8개가 모두 동작합니다. '코드만으로 조립한 대본'은 1회 시험했는데, 그대로는 쓸 수 없었습니다. DB는 재료로 쓰고, 문장은 다시 써야 한다는 결론입니다.

## ✅ 1. 대화록 정제·분류 30편 — [REFINE_ALL_v1.md](../../../../AI_Factory/go_kibo/reports/REFINE_ALL_v1.md)

- **방법**(작가님 05:03 "LLM이 제일 잘하는 영역, 다만 맥락을 모를 뿐"):
  - 먼저 맥락 묶음 v1(`COMMENTARY_CONTEXT_v1.md`)을 만들었습니다: 해설 원칙, 감수 예문, 라벨 8, 버림 코드 6, 경계 사례, 인명표, 용어 408.
  - 코드로 발화를 쪼갰습니다(`refine_split.py` — `>>` 화자 전환, 조각 병합).
  - LLM 일꾼(Claude writer, 구독 범위)이 묶음 단위로 발화마다 판단했습니다. 외부 유료 API는 0입니다.
- **실행**: 시범 1편(v0 6묶음 → 쌍아 검토 → v1 재시범 8묶음), 나머지 29편 89묶음, 재분류 3묶음. 동시 실행은 15개였습니다.
- **결과**:
  - 발화 27,387개 중 남김 25,645개, 버림 1,742개(6.4%: NOISE 596 · SCREEN 385 · GREET 316 · CHAT 261 · MUSIC 118 · AD 66).
  - 라벨: 국면 11,817 · 선수대회 3,658 · 수순 2,949 · 추임새 2,595 · 형세 2,083 · Q 897 · A 790 · 기타 856.
  - Q&A 790쌍.
- **해설자별 발화**: 송태곤 15,332(Q&A 470) · 목진석 9,632(294) · 이현욱 2,423(26, 대부분 1인 방송).
- **판 의존 표시(⑦)**: 국면 문장 중 판 없이 뜻이 서는 것은 4,341개(37%), 형세는 76%, 수순은 12%입니다. 판독이 없는 영상에서 장면 해설 예문으로 쓸 수 있는 것은 이 4,341개입니다.
- **예시**: Q&A 16쌍(이현욱 쪽 Q&A가 적어 20을 못 채움)과 국면 해설 20개를 해설자별로 고르게 뽑았습니다. 방송 원문이라 레포 밖 `commentary_v0/refine/v1_examples.md`에 두었습니다.
- **품질 관리**:
  - 형식 검사 결과 전 묶음에서 오류·누락이 0입니다.
  - 일꾼 3묶음(e19·e27·e29)은 다시 돌렸습니다. 둘은 용어를 정규식으로 뽑았고, 하나는 'NOISE'를 라벨로 넣어 형식을 어겼습니다.
  - 일꾼 지시 파일에 '라벨·용어·판 의존은 발화마다 직접 판단, 자동 추출 금지'를 추가했습니다(05:26).
  - 재시범 중 일꾼 1개가 `rm -rf`를 시도했다가 집행 훅에 막혔습니다. 이후 지시에서 금지를 명시했습니다.

## ✅ 2. 발화·말투 정본 DB v0 — [AI_Factory/corpus/](../../../../AI_Factory/corpus/README.md)

- **정본**: `~/.monkos/corpus/monk_corpus.db`(SQLite, 78MB, 레포 밖). 스키마·적재·질의·검사 도구만 레포에 둡니다.
- **스키마 그림**(`schema_v0.sql`):
```
source(id, kind, rights: ref_only|own_generated|author_reviewed|author_self, domain)
  ├─ segment(원 자막 구간) ── embedding(owner=segment, Float32 BLOB, text-multilingual-embedding-002)
  ├─ utterance(seq, segment_id, speaker_id, text, keep/drop_code, label, board_dep, labeler)
  │     ├─ utterance_term(term|concept) ── term(한국기원 408 + 일꾼 추가 13)
  │     ├─ qa_pair(q_utt, a_utt)
  │     └─ go_scene(바둑 확장: 시각·수순·실전/참고도·판 검출 꼬리표·엔진 칸)
  ├─ gold(감수 예문: 장면 사실 JSON ↔ 작가님 원문)
speaker(name, kind: real|character|role, role: 해설|캐스터|선수|작가님|캐릭터|불명)
  └─ style_feature(filler·ending·rate·voice_file·persona_note — 유니·다인 자리)
```
- **적재 행 수**: source 42 · segment 17,126 · utterance 27,387(분류 판단 27,387 + 판독 9편 전사 장면 556 별도) · qa_pair 790 · term 421 · utterance_term 18,356 · embedding 15,101 · go_scene 556 · gold 2 · style_feature 59.
- **임베딩**: 새 비용 0입니다. 앞서 만든 구간 벡터를 재사용했고, 발화는 `segment_id`로 구간 벡터를 공유합니다.
- **벡터 저장**: sqlite-vec는 미설치라 설치하지 않았습니다. 대신 같은 DB에 BLOB으로 넣고, 검색은 numpy 전수 코사인으로 합니다. 기존 `scripts/retrieval/build_index.js`의 `chunk_embeddings` BLOB 방식과 같습니다.
- **질의 8개 결과**(`query_v0.py`, 원문은 레포 밖 `query_v0_result.md`):
  - Q1 껴붙임 + 손해 5집↑: 5행(감수 예문 #2 + 방송 국면 문장).
  - Q2 목진석 Q&A: 10행.
  - Q3 판 없이 서는 국면 문장(해설자·화자별): 12행, 송태곤 2,613/6,151.
  - Q4 감수 예문: 2행.
  - Q5 해설자별 추임새: 56행.
  - Q6 '바꿔치기' 구간과 가까운 벡터 5개.
  - Q7 권리 등급별: ref_only 40출처·27,943발화, author_reviewed 1·감수 2, own_generated 1.
  - Q8 유니·다인 말투 자리 3행.
- **정정 05:24 반영**: 권리 칸은 출처 추적용이고 금지 필터가 아닙니다. 선은 출력에서 긋습니다 → `check_overlap.py`가 원문과 연속 어절 n개 이상 일치하거나 실존 해설자 실명이 나오면 경고합니다.
  - v2 대본은 n=6 기준 경고 0입니다.
  - 프로 원문을 그대로 넣은 대조군은 13어절 일치로 경고가 났습니다.

## 💡 3. 코드 조립형 vs LLM 대본 비교 1회 — `compose_v0.py`(결과는 레포 밖 `~/.monkos/corpus/compose_g836.md`)

- **조립형**: 틀 문장(장면 사실·엔진 손익)에 SQL로 고른 프로 국면 문장(판 없이 서는 것, 장면 개념 겹침)을 섞었습니다. 243자입니다.
- **결과**:
  - 고른 문장이 앞뒤 맥락 없는 조각이었습니다("…바꿔치기를"으로 끊김). 다른 판의 이야기라 장면과 맞지 않았습니다.
  - 원문 일치 경고가 8줄 중 3줄 나왔습니다. 그대로 이어 붙이니 원문 복사가 된 것입니다.
- **판단**: '코드 + TTS만으로 즉시 해설'은 틀 문장 부분(장면 사실·손익 숫자)까지만 성립합니다. 해설의 말맛이 나는 부분은 DB를 근거·말투 재료로 검색하고, LLM이 감수 예문을 기준으로 새로 써야 합니다. 그 출력에 `check_overlap`을 거는 구조가 맞습니다. 이렇게 쌓인 '장면 사실 ↔ 감수된 문장' 짝이 소형 모델 증류 데이터가 됩니다.

## ⏳ 미실증·남은 일
- 분류 정확도는 시범 표본 50(쌍아 검토)만 거쳤습니다. 30편 전체 표본 정확도표는 아직 없어, 작가님·쌍아 검토 표본이 필요합니다.
- 장면 사전과 G836 v2를 정제본 근거로 다시 만드는 일은 아직 안 했습니다. 판독 9편은 대화록 30편과 다른 영상이라 정제본을 바로 연결할 수 없습니다. 판독 9편의 Gemini 전사를 같은 방식으로 정제할지는 결정이 필요합니다.
- 도구 맵 등재(`.claude/rules/references.md` — 쌍아 소관): `AI_Factory/corpus/*`, `refine_*.py`, `go_terms.py`, `embed_commentary.js`. 등재를 청구합니다.

## 🔀 비용
- LLM 일꾼: writer 서브에이전트 약 106회(시범 14 + 29편 89 + 재분류 3). 구독 범위이고 외부 API는 0입니다.
- Vertex·ElevenLabs 추가 지출 0, 설치 0.

## 📁 변경(레포)
- `AI_Factory/go_kibo/{refine_split.py, refine_assemble.py, refine_report.py, build_context.py}` · `reports/{COMMENTARY_CONTEXT_v1.md, REFINE_V1_v0.md, REFINE_ALL_v1.md}`
- `AI_Factory/corpus/{README.md, schema_v0.sql, load_v0.py, query_v0.py, check_overlap.py, compose_v0.py}`
- 레포 밖: `~/.monkos/corpus/monk_corpus.db` · `commentary_v0/refine/v1_*` · `WORKER_v1.md`
