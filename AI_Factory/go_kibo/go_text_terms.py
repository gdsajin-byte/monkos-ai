#!/usr/bin/env python3
"""바둑 해설 문장 용어 검출기 v1 — 개념·손익·형세어(문장 쪽). 판 모양 검출(go_terms.py)과 짝. 표준 라이브러리만.

  from go_text_terms import detect_text
  hits = detect_text("백이 두터워졌어요", ctx="앞 발화 뒤 발화")   # [(표준명, kind, 규칙명)]
  python3 go_text_terms.py "문장"                                  # 한 문장 시험
  python3 go_text_terms.py --selftest                              # 양성·음성 대조군

배경(ORDER_20261108 막내9): 정제 일꾼(LLM) 꼬리표가 수 모양 위주라 정석·사활·완생·팻감·두터움 같은
개념·손익어를 놓쳤다(REVIEW_20261108 표본 50). 해설 수준 기준 = 개념·손익 언어(feedback_go_commentary_level).

규칙:
  - 대상 = 용어 사전 v0 분류 1~8(GO_TERMS 408, 한국기원 바둑용어사전 1차 출처) 가운데 개념·손익·형세·사활어
    + 사전 외 보충(SUPPLEMENT — 완생·미생·철벽·수읽기·타개, 출처 미확인·감수 대상).
  - 활용형·띄어쓰기 변형은 정규식 하나에 모은다(두텁다/두터움/두터워/두꺼운, 팻감/팻 감, 손빼다/손을 빼).
  - 일상어 충돌(정석·대세·악수·맛·모양·가볍다·사활을 걸다·계가(관계가) 등)은 EXCLUDE 로 끊고,
    GATE 표시 용어는 발화+앞뒤 발화에 판 단서(GO_CUE)가 있을 때만 붙인다.
  - kind(term/concept)는 정제 일꾼 꼬리표 관례를 따른다(팻감·가일수·반집 등은 term, 나머지 concept).
"""
import re
import sys

# 판 단서 — 같은 발화나 앞뒤 발화에 있으면 바둑 맥락
GO_CUE = re.compile(r"흑|백(?!만|화점|신|성|두산|화)|돌|[상하좌우]변|[좌우][상하]귀|귀(에|를|는|쪽|의)|중앙|[0-9한두세네]\s?집|착점|착수|대마|단수|끊|붙여|젖혀|화점|소목|삼삼|걸침|걸쳐|포석|형세|승률|날일자|한\s?칸|수순|팻감|패를|이\s?수[가는를]?|바둑")

# (표준명, kind, 정규식, 제외 정규식 또는 None, GATE 여부, 출처)  — 출처: 'kba' = GO_TERMS(한국기원), 'sup' = 보충
RULES = [
    # --- 두께·모양 평가
    ("두텁다", "concept", r"두텁|두터[운워움웠우]|두껍|두꺼[운워웠]|철벽", r"두꺼운\s?(옷|책|이불|종이)|얼굴이 두껍|낯이 두껍", True, "kba"),
    ("엷다", "concept", r"엷[다고은게어었]", None, False, "kba"),
    ("우형", "concept", r"우형", None, False, "kba"),
    ("모양", "concept", r"(좋은|나쁜|뭉친|두터운|엷은|무거운|가벼운|탄력\s?있는|멋진)\s?모양|모양(이|을|도|은)?\s?(좋|나쁘|나빠|무너|갖추|갖춰|정비|뭉치|찌그러)", None, True, "kba"),
    ("가볍다", "concept", r"가볍게\s?(두|처리|타개|버리|움직|받|응수|가)|가벼운\s?(행마|수|돌|모양|처리)|돌이\s?가벼", None, True, "kba"),
    ("무겁다", "concept", r"(돌|모양|대마|말)이\s?무거|무거운\s?(돌|모양|행마|대마|말)|무겁게\s?(두|움직|끌)", None, True, "kba"),
    ("발빠르다", "concept", r"발\s?빠르|발\s?빠른|발\s?빨라", None, False, "kba"),
    # --- 손익·영토
    ("실리", "concept", r"실리(?!콘|카)", None, False, "kba"),
    ("세력", "concept", r"세력", r"세력적으로\s?(문제|컨디션|힘들)", False, "kba"),
    ("외세", "concept", r"외세", None, False, "kba"),
    ("대세", "concept", r"대세(점|를|에|가|는|의|적|상|로)?", r"(요즘|최근|요새|요즈음|유행|트렌드)[^.?!]{0,6}대세|대세(인|다|네|예요|이에요|입니다)\s?(요즘|라고|라는)", True, "kba"),
    ("큰곳", "concept", r"큰\s?곳|큰\s?자리", None, True, "kba"),
    ("요처", "concept", r"요처|급소", None, False, "kba"),
    ("바꿔치기", "concept", r"바꿔\s?치|바꿔\s?친|바꿔\s?쳐|바꿔\s?칠", None, True, "kba"),
    ("사석", "concept", r"사석(?!\s?[0-9])|버림돌|버리는\s?돌|돌을\s?버리", None, False, "kba"),
    ("손빼다", "concept", r"손\s?빼|손을\s?빼|손\s?뺐|손을\s?뺐|손\s?빼기|손빼기|손뺌|손\s?뺄", None, True, "kba"),
    # --- 선후수
    ("선수", "concept", r"(절대|준|양|역|편)\s?선수|선수(로|를\s?(잡|뽑|취|빼앗|당|놓)|예요|이에요|냐|끝내기|활용|가\s?아니|가\s?되|가\s?돼|\s?후수|\s?교환)", r"선수(들|권|분|님|단|촌|생활|시절)|(두|세|네|양)\s?선수(가|는|의|들|를|입|인|이)|[0-9]+\s?년\s?선수|(?:^|\s)(?!절대|완전|확실|준|양|역|편|이게|이건|그게|큰|작은)[가-힣]{2,5}\s선수(?!\s?(끝내기|활용|교환|로))|(좋은|훌륭한|대단한|강한|젊은|어린|노련한)\s?선수|선수로(서|는|도)|선수로\s?(다시|넘어|돌아|잠시|하여금)|[가-힣]선수\s선수|준\s선수(가|는|를|들)", True, "kba"),
    ("후수", "concept", r"후수", None, False, "kba"),
    ("맞보기", "concept", r"맞보기|맞보[는고아]|맞봐|맛보기|맛복", r"맛보기로\s?(보여|소개|들려|공개|맛)|맛보기\s?(영상|방송|강의)", True, "kba"),  # 맛보기·맛복 = 자막 STT 표기(11-08 실측 0건 대조)
    # --- 사활·패
    ("사활", "concept", r"사활", r"사활을\s?걸|사활이\s?걸", False, "kba"),
    ("완생", "concept", r"완생", None, False, "sup"),
    ("미생", "concept", r"미생(?!물)", None, True, "sup"),
    ("곤마", "concept", r"곤마", None, False, "kba"),
    ("대마", "concept", r"대마(?!초|도)", None, False, "kba"),
    ("수상전", "concept", r"수상전|수\s?싸움", None, False, "kba"),
    ("팻감", "term", r"팻감|팻\s감|패감", None, False, "kba"),
    ("가일수", "term", r"가일\s?수", None, False, "kba"),
    ("맛", "concept", r"뒷맛|패맛|(?<![가-힣])맛(이|을|도|은)?\s?(남|나쁘|나빠|없[이어고는애]|사라|지우|없애|안\s?좋|좋지\s?않)", r"맛있|맛없|맛집|입맛", True, "kba"),
    # --- 끝내기·계가
    ("끝내기", "concept", r"끝내기", r"끝내기\s?(홈런|안타|승|타)", False, "kba"),
    ("계가", "concept", r"(?<![가-힣])계가|계가(바둑|하|해|로)", None, False, "kba"),
    ("반집", "term", r"반\s?집", r"반\s?집에\s?(살|가)|반집안", True, "kba"),
    ("공배", "concept", r"공배", None, False, "kba"),
    # --- 수 평가
    ("정석", "concept", r"정석", r"(투자|연애|공부|인생|방송|성공|요리|육아|창업)의\s?정석|정석적인\s?(방송|진행|해설)", True, "kba"),
    ("포석", "concept", r"포석", r"포석을\s?(깔|다지)", True, "kba"),
    ("악수", "concept", r"악수", r"악수(를|하|해)\s?(나누|청|건|하자|했다|해요)|악수(를)?\s?하고", True, "kba"),
    ("묘수", "concept", r"묘수", None, False, "kba"),
    ("승부수", "concept", r"승부수", None, False, "kba"),
    ("무리", "concept", r"(?<![가-힣])무리수|(?<![가-힣])무리한\s?(수|공격|침입|끊|행마|진출|싸움|돌)|(?<![가-힣])무리(였|입니다|예요|이고|죠|하게\s?(끊|들어|공격|두|버티))", None, True, "kba"),
    ("맥점", "concept", r"맥점", None, False, "kba"),
    ("완착", "concept", r"완착", None, False, "kba"),
    ("속수", "concept", r"속수(?!무책)", None, False, "kba"),
    ("기세", "concept", r"기세", r"(최근|요즘|그|연승|상승|팀의|선수의)\s?기세", True, "kba"),
    ("형세", "concept", r"형세", None, False, "kba"),
    ("약점", "concept", r"약점|단점(?!이\s?있는\s?사람)", None, True, "kba"),
    # --- 공격·견제
    ("공격", "concept", r"공격", None, True, "kba"),
    ("압박", "concept", r"압박", None, True, "kba"),
    ("삭감", "concept", r"삭감", None, True, "kba"),
    ("침입", "concept", r"침입|뛰어들", None, True, "kba"),
    ("봉쇄", "concept", r"봉쇄", None, True, "kba"),
    ("타개", "concept", r"타개", None, False, "sup"),
    ("수읽기", "concept", r"수\s?읽기|수를\s?읽", None, False, "sup"),
]
SUPPLEMENT = {n for n, _, _, _, _, s in RULES if s == "sup"}
_C = [(n, k, re.compile(p), re.compile(x) if x else None, g) for n, k, p, x, g, _ in RULES]


def detect_text(text, ctx=""):
    """text: 발화, ctx: 앞뒤 발화(판 단서 판정에만 쓴다). → [(표준명, kind, 규칙)] (순서 유지·중복 없음)"""
    if not text:
        return []
    cue = None
    out = []
    for name, kind, pat, exc, gate in _C:
        hits = [m for m in pat.finditer(text)]
        if not hits:
            continue
        if exc:
            bad = [(m.start(), m.end()) for m in exc.finditer(text)]
            hits = [m for m in hits if not any(a <= m.start() < b or m.start() <= a < m.end() for a, b in bad)]
            if not hits:
                continue
        if gate:
            if cue is None:
                cue = bool(GO_CUE.search(text) or GO_CUE.search(ctx or ""))
            if not cue:
                continue
        out.append((name, kind, "gate" if gate else "direct"))
    return out


SELFTEST = [  # (문장, 기대 포함, 기대 불포함)
    ("막히는 건 막히는 거고 어 조금 더 두터움을 주더라도 흑의 돌들이 상변 쪽으로 진출하면서 상변 쪽에 좀 집을 기대를 해 보겠다. 어 이런 지금 정석입니다.", {"두텁다", "정석"}, set()),
    ("자 흑도이 사활에 대한 가일 수가 필요합니다", {"사활", "가일수"}, set()),
    ("좌변 좌상 2대만은 완생이냐 꼭 그렇지도 않아요. 내가 살아 있고 상대가 완생이 아닌게", {"완생"}, set()),
    ("이게 다 백이 팻감 절대 선수이기 때문에 아예 맛도 없이 그냥 깔끔하게 집이 났어요.", {"팻감", "선수", "맛"}, set()),
    ("백도 생각해 보면 뭐 철벽처럼 보이지만", {"두텁다"}, set()),
    ("백돌이 사실상 두터워진 상황이에요", {"두텁다"}, set()),
    # 음성 대조군 — 일상어
    ("이 두 팀은 사활을 걸고 싸우고 있습니다", set(), {"사활"}),
    ("요즘 대세는 이런 방송이죠", set(), {"대세"}),
    ("투자의 정석이라는 책이 있잖아요", set(), {"정석"}),
    ("두 분 악수를 나누시고요", set(), {"악수"}),
    ("그 관계가 좀 복잡하죠", set(), {"계가"}),
    ("신진서 선수가 오늘 컨디션이 좋아 보이네요", set(), {"선수"}),
    ("일본에서는 남아 있는 선수가 이마유타 선수입니다", set(), {"선수"}),
    ("맥점을 찾아낸 이후에는 깔끔한 마무리였다고 볼 수 있네요", set(), {"무리"}),
    ("여기와 여기가 맛보기가 되는 순간 흑이 좋아요", {"맞보기"}, set()),
    ("오늘 강의 맛보기로 보여 드릴게요", set(), {"맞보기"}),
    ("흑이 무리예요. 끊는 거는 약간 무리였던 거 같고", {"무리"}, set()),
    ("이 집 짜장면 맛이 없어요", set(), {"맛"}),
    ("오늘 밥 먹으러 가는 모양이에요", set(), {"모양"}),
    ("끝내기 홈런이 나왔네요", set(), {"끝내기"}),
]


def selftest():
    bad = 0
    for s, want, ban in SELFTEST:
        got = {n for n, _, _ in detect_text(s)}
        miss, wrong = want - got, ban & got
        ok = not miss and not wrong
        bad += not ok
        print("○" if ok else "×", sorted(got), ("누락 " + str(sorted(miss))) if miss else "", ("오검출 " + str(sorted(wrong))) if wrong else "", "|", s[:40])
    print(f"selftest {len(SELFTEST) - bad}/{len(SELFTEST)}")
    return bad


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        sys.exit(1 if selftest() else 0)
    for s in sys.argv[1:]:
        print(detect_text(s))
