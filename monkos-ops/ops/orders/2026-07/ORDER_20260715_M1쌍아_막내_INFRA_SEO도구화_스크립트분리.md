---
type: order
date: 2026-07-15
device: M1
agent: 쌍아
recipient: 막내
portfolio: PF_INFRA
status: 대기
---

# 지시서: SEO 데이터 수집 도구화 — daily_briefing.py 함수 → 독립 스크립트 분리 + 스킬 에일리어스

**[2026-07-15 07:05 KST]** M1/쌍아 → 막내

---

## 배경

7/14 세션에서 `daily_briefing.py`에 5채널 수집 코드(+387행)를 확장했으나,
이 코드는 **GitHub Actions 전용**(환경변수 주입, main 함수 일괄 실행)이라
로컬 CLI·VSCode에서 개별 채널을 즉석 호출할 수 없다.

**목표**: daily_briefing.py의 각 수집 함수를 독립 스크립트로 분리하여,
어디서든 단독 실행 가능하게 도구화. 스킬(`/seo-query`)이 이 스크립트를 호출하는 에일리어스 역할.

```
[실체]  scripts/tools/*.sh   ← SM 키 자동 주입 + 단독 실행 + JSON 출력
[별명]  .claude/skills/seo-query.md  ← 에이전트가 스크립트를 호출하는 인터페이스
[재사용] daily_briefing.py   ← 같은 Python 모듈을 import (코드 중복 0)
```

---

## 준수 조항

- 헌법 4조 1항: API 키·비밀번호 생성/추측 금지. 시크릿 값 노출 금지
- 헌법 4조 2항: 파괴적 명령 금지
- ch4 10조: 시크릿은 `secret` 커맨드 경유 (본 건은 이미 등록 완료 — 코드에서 SM 참조만)

---

## 권한

- `scripts/tools/` 파일 생성·수정
- `.claude/skills/seo-query.md` 수정
- `.github/scripts/daily_briefing.py` 리팩토링 (함수 분리, 동작 변경 금지)
- 테스트 실행 (dry-run, 실제 API 호출은 `--dry-run` 인자 있을 때만 스킵)

---

## Phase 1: Python 모듈 분리

### 1-1. `scripts/tools/seo_collectors.py` 신설

`daily_briefing.py`에서 아래 6개 함수를 **별도 모듈로 추출**:
- `fetch_naver_searchad(keywords)` → 네이버 검색광고
- `fetch_naver_datalab(keywords)` → 네이버 DataLab
- `fetch_bing_wmt()` → Bing WMT
- `fetch_pagespeed(urls, api_key)` → PageSpeed Insights
- `fetch_ga4_extended(key_json, property_id, target_date)` → GA4 디바이스별
- `fetch_gsc_url_inspection(key_json, site_url, urls)` → GSC URL Inspection

**원칙**:
- `daily_briefing.py`는 이 모듈을 `from scripts.tools.seo_collectors import ...` 또는 `sys.path` 방식으로 import하여 기존 동작 100% 유지
- 함수 시그니처 변경 금지
- 각 함수는 단독 실행 시 JSON stdout 출력 가능하도록 `if __name__ == "__main__"` 블록에 CLI 엔트리포인트 추가

### 1-2. CLI 엔트리포인트 설계

```bash
# 사용법
python scripts/tools/seo_collectors.py naver-searchad [--keywords "증명사진,여권사진"]
python scripts/tools/seo_collectors.py naver-datalab [--keywords "증명사진,여권사진"]
python scripts/tools/seo_collectors.py bing
python scripts/tools/seo_collectors.py pagespeed [--urls "https://monkos.ai/"]
python scripts/tools/seo_collectors.py all  # 전 채널 수집
```

- 출력: JSON (stdout). 에러/경고는 stderr
- 키워드 미지정 시 기본값: `NAVER_KEYWORDS` 상수 사용
- `--dry-run`: API 호출 없이 구조만 출력

---

## Phase 2: Shell 래퍼 (SM 키 주입)

기존 `ga4_mcp.sh` 패턴을 따른다 (SM에서 키 추출 → 환경변수 세팅 → Python 실행).

### 2-1. `scripts/tools/seo_collect.sh` 신설

```bash
#!/bin/bash
# SEO 데이터 수집 통합 래퍼 — SM 키 주입 + seo_collectors.py 실행

# SM에서 키 주입
export NAVER_SEARCHAD_API_KEY=$(gcloud secrets versions access latest --secret=NAVER_SEARCHAD_API_KEY --project=monkos 2>/dev/null)
export NAVER_SEARCHAD_SECRET_KEY=$(gcloud secrets versions access latest --secret=NAVER_SEARCHAD_SECRET_KEY --project=monkos 2>/dev/null)
export NAVER_SEARCHAD_CUSTOMER_ID=$(gcloud secrets versions access latest --secret=NAVER_SEARCHAD_CUSTOMER_ID --project=monkos 2>/dev/null)
export NAVER_DATALAB_CLIENT_ID=$(gcloud secrets versions access latest --secret=NAVER_DATALAB_CLIENT_ID --project=monkos 2>/dev/null)
export NAVER_DATALAB_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=NAVER_DATALAB_CLIENT_SECRET --project=monkos 2>/dev/null)
export BING_WMT_API_KEY=$(gcloud secrets versions access latest --secret=BING_WMT_API_KEY --project=monkos 2>/dev/null)

# GCP SA (GA4/GSC용)
# ga4_mcp.sh와 동일 패턴으로 SA 키 캐시
CRED_DIR="$HOME/.config/monkos-mcp"
CRED_FILE="$CRED_DIR/sa_key.json"
if [ ! -f "$CRED_FILE" ]; then
  mkdir -p "$CRED_DIR"
  gcloud secrets versions access latest --secret=GCP_SA_KEY --project=monkos 2>/dev/null | base64 -d > "$CRED_FILE" 2>/dev/null
fi
export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"
export GCP_SA_KEY=$(base64 < "$CRED_FILE" 2>/dev/null)
export GA4_PROPERTY_ID="..."  # SECRET_INVENTORY 참조
export GSC_SITE_URL="sc-domain:monkos.ai"

python3 "$(dirname "$0")/seo_collectors.py" "${@:-all}"
```

- `chmod +x` 필수
- GA4_PROPERTY_ID: SECRET_INVENTORY.md에서 실값 확인 후 기재 (추측 금지 — `secret check GA4_PROPERTY_ID` 또는 인벤토리 Read)

### 2-2. 개별 채널 래퍼는 만들지 않는다

`seo_collect.sh naver-searchad` 형태로 서브커맨드 분기. 파일 6개 만들 필요 없음.

---

## Phase 3: 스킬 에일리어스 갱신

### 3-1. `.claude/skills/seo-query.md` 수정

현재 MCP 의존 → **스크립트 호출 방식으로 전환**:

```markdown
---
name: seo-query
description: SEO 데이터 즉시 조회 — 네이버/GSC/GA4/Bing/CWV 전 채널 수집
user_invocable: true
---

# /seo-query — SEO 데이터 즉시 조회

이 스킬이 호출되면 아래를 실행한다:

1. `scripts/tools/seo_collect.sh all` 실행 (Bash 도구 사용)
2. JSON 출력을 파싱하여 마크다운 테이블로 정리
3. 채널별 성과 + 이상 징후를 보고

채널별 단독 조회:
- `scripts/tools/seo_collect.sh naver-searchad` — 네이버 키워드 검색량
- `scripts/tools/seo_collect.sh naver-datalab` — 네이버 30일 트렌드
- `scripts/tools/seo_collect.sh bing` — Bing 검색 성과 + 백링크
- `scripts/tools/seo_collect.sh pagespeed` — Core Web Vitals

SM 키 주입 실패 시: 해당 채널 SKIP + 경고 출력.
전 채널 실패 시: 최신 브리핑 파일(`monkos-ops/ops/briefings/`)을 Read하여 대체.
```

---

## Phase 4: daily_briefing.py 연동

### 4-1. import 경로 변경

`daily_briefing.py`의 해당 함수들을 삭제하고 `seo_collectors.py`에서 import.
방법: 파일 상단에 `sys.path` 추가 또는 상대 import.

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../scripts/tools"))
from seo_collectors import (
    fetch_naver_searchad, fetch_naver_datalab, fetch_bing_wmt,
    fetch_pagespeed, fetch_ga4_extended, fetch_gsc_url_inspection,
)
```

### 4-2. 검증

- `python .github/scripts/daily_briefing.py --help` 또는 dry-run으로 import 정상 확인
- 기존 GitHub Actions 워크플로우 동작에 영향 없음을 확인

---

## 완료 기준

1. `scripts/tools/seo_collectors.py` 단독 실행 시 각 채널 JSON 출력 정상
2. `scripts/tools/seo_collect.sh all` 실행 시 SM 키 자동 주입 + 전 채널 수집 정상
3. `daily_briefing.py`가 분리된 모듈을 import하여 기존과 동일하게 동작
4. `.claude/skills/seo-query.md`가 스크립트 호출 방식으로 갱신

## 완료 보고

- 헌법 2조 2항·3조 2항 준수: 수발신 헤더 + COMPLETION 파일 필수
- 활성 PF(PF_INFRA) 히스토리 1행 어펜드
