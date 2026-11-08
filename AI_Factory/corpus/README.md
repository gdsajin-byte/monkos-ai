# AI_Factory/corpus — MONK 발화·말투 정본 DB v0

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261107_iMac쌍아_막내1_INFRA_발화DB_설계.md` (작가님 05:18·05:21·정정 05:24) · PF_GO
> 정본 파일은 레포 밖 `~/.monkos/corpus/monk_corpus.db`(SQLite). 이 폴더에는 스키마·적재·질의·검사 도구만 둔다.

| 파일 | 하는 일 |
|---|---|
| `schema_v0.sql` | 범용 뼈대(source 권리 등급 · speaker 실명/캐릭터/역할 · segment · utterance · qa_pair · term · utterance_term · embedding BLOB · gold · style_feature) + 바둑 확장 go_scene |
| `load_v0.py` | 1차 적재(새로 만든 뒤 교체): 유튜브 해설 30편 정제·분류(발화 27,387) + 용어 사전 v0 + 구간 임베딩 15,101(재사용, 새 비용 0) + 판독 9편 장면 사전 556 + 감수 예문 2 + 말투 확장 시험 행 |
| `query_v0.py` | 질의 예시 8(껴붙임 감수·목진석 Q&A·판 없이 서는 국면 문장·감수 예문·해설자별 추임새·유사 구간 벡터 검색·권리 등급별 출처·캐릭터 자리) → 결과는 레포 밖 `query_v0_result.md` |
| `check_overlap.py` | 출력 검사 ①(정정 05:24): 생성 대본이 방송 원문과 연속 어절 n개↑ 겹치면 경고 + 실존 해설자 실명 경고. 대본 JSON·텍스트·`--text` |
| `tag_terms_v1.py` | 문장 용어 검출(go_kibo/go_text_terms.py) → utterance_term 합집합 + 출처 표 utterance_term_det(added=1이 검출분). 멱등·규칙 개정 시 재실행. **load_v1.py로 다시 만들면 이 단계도 다시**(11-08 막내9) |
| `compose_v0.py` | 코드 조립형 대본 시험(LLM 없음 — 틀 문장 + DB SQL 선택) vs LLM 대본 v2 비교 1회 → 레포 밖 `compose_g836.md` |

```bash
python3 AI_Factory/corpus/load_v0.py            # ~/.monkos/corpus/monk_corpus.db (약 78MB)
python3 AI_Factory/corpus/query_v0.py
python3 AI_Factory/corpus/check_overlap.py apps/go-explainer-e2e/scripts/s02_v2.json --n 8
```

- 벡터: 같은 DB의 BLOB(Float32) — `scripts/retrieval/build_index.js`(chunk_embeddings)와 같은 방식. sqlite-vec 미설치(11-07 실측)라 검색은 numpy 전수 코사인(1.5만 행 수십 ms). 확장 설치는 규모가 커지면 별건.
- 권리 칸은 **출처 추적용**(금지 필터 아님 — 정정 05:24). 선은 출력에서: 원문 긴 일치 경고 · 실존 해설자 이름·목소리 흉내 금지(목소리는 작가님·유니·다인).
- 임베딩은 원 자막 **구간** 단위(15,101)다. 발화는 `utterance.segment_id`로 구간 벡터를 공유한다(발화 단위 재임베딩 시 약 $0.04).
