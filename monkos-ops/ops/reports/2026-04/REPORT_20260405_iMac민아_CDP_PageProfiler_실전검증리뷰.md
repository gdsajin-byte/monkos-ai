---
type: report
from: iMac/민아
to: iMac/쌍아 + 막내 전원
date: 2026-04-05
subject: CDP PageProfiler 실전 검증 리뷰 — Phase 2 달성 + Phase 3 개선점
pf: PF_CDP
status: 공유
portfolio: PF_CDP
---

# CDP PageProfiler 실전 검증 리뷰

**[2026-04-05 16:30 KST] iMac/민아**

> 작가님과 함께 4시간 동안 실제 사이트를 돌며 PageProfiler를 검증한 결과.
> 이론이 아닌 실전 체감 기준으로 작성.

---

## 1. 테스트 범위

| 사이트 | 유형 | 수행 작업 |
|--------|------|----------|
| monkos.ai | 자체 서비스 | 프로파일링 + 네비게이션 |
| monkos.ai/admin/blog-edit.html | 자체 어드민 | 풀 폼 입력 + 블로그 작성 |
| 티스토리 | 외부 (TinyMCE) | 카카오 로그인 → 풀 블로그 작성 |
| 소진공 (semas.or.kr) | 정부 사이트 | 메뉴 네비게이션 + 공고 탐색 |
| 기업마당 (bizinfo.go.kr) | 정부 공고 | 목록 스캔 + 검색 + 상세 진입 + 브리핑 |
| GSC (search.google.com) | 외부 SPA | 프로파일링 + 데이터 확인 |
| IRIS (iris.go.kr) | 정부 인증 | 세션 확인 + 첨부파일 탐지 |

---

## 2. Phase 2 달성 확인

### ✅ 압도적으로 달성된 것

| 항목 | 목표 | 실측 | 배율 |
|------|------|------|------|
| 첫 방문 프로파일링 | 1,500ms | **7~18ms** | 100x+ |
| 재방문 캐시 히트 | 100ms | **2~5ms** | 20~50x |
| 버튼 클릭 정확도 | 80% | **100%** (12/12) | 완벽 |
| 폼 필드 입력 | 필드당 2초 | **필드당 2~4ms** | 500x+ |
| 외부 사이트 프로파일링 | 동작 여부 | **전부 동작** | — |

### ✅ 실전 검증 완료된 기능

1. **smart_click(이름)** — 이름으로 버튼 즉시 클릭. 티스토리 TinyMCE 에디터에서 12개 툴바 버튼 전부 성공
2. **smart_fill(셀렉터, 값)** — 폼 필드 즉시 입력. 단, dispatchEvent 필요 (아래 개선점)
3. **smart_navigate(이름)** — 이름으로 링크/메뉴 이동. 소진공 지원사업 메뉴 진입 성공
4. **profile(force=True)** — 페이지 변경 시 강제 재프로파일. DOM 해시 비교 자동 감지 동작 확인
5. **캐시 자동 관리** — ~/.cache/cdp_profiles/ 에 URL별 저장, TTL 7일, 변경 시 자동 갱신

### ✅ 블로그 실전 작성 검증

| 플랫폼 | 에디터 | 본문 입력 방식 | 결과 |
|--------|--------|-------------|------|
| MONKOS Admin | Toast UI (ProseMirror) | Markdown 모드 + insertText | ✅ 전체 폼 완성 |
| 티스토리 | TinyMCE | tinymce.activeEditor.setContent() | ✅ 전체 폼 완성 |

---

## 3. Phase 3 개선이 필요한 것

### 🔴 critical — 실전 사용에 직접 영향

#### C1. smart_fill이 화면에 반영 안 되는 문제

**현상**: smart_fill로 값을 넣어도 React/Vue 프레임워크가 감지 못해서 화면에 안 보임.
**원인**: value 직접 변경은 프레임워크의 state 업데이트를 트리거하지 않음.
**해결**: dispatchEvent(new Event('input', {bubbles:true})) + change 이벤트를 함께 발사.
현재는 민아가 evaluate로 수동 처리했으나, **smart_fill 내부에 이벤트 발사를 내장해야 함.**

#### C2. 에디터별 입력 방식 자동 감지

**현상**: Toast UI는 window.editor.setHTML(), TinyMCE는 tinymce.activeEditor.setContent(), ProseMirror는 insertText — 에디터마다 다름.
**원인**: 에디터 라이브러리가 contenteditable을 각자 방식으로 래핑.
**해결**: 프로파일링 시 에디터 유형을 자동 감지하고 프로파일에 기록.

```
감지 우선순위:
1. window.tinymce → TinyMCE → setContent()
2. window.toastui → Toast UI → setMarkdown() / setHTML()
3. ProseMirror → document.execCommand('insertText')
4. CKEditor → window.CKEDITOR
5. 기본 contenteditable → innerHTML 직접
```

#### C3. tab_index가 iframe을 포함하여 불안정

**현상**: tab_index=10이 page 타입이 아닌 iframe 타겟에 연결되어 스크린샷/명령 실패.
**원인**: /json 엔드포인트가 page+iframe 전부 반환. 인덱스가 세션 중 변동.
**해결**: CDP 클래스 connect()에서 **type='page'만 필터링** 후 인덱스 매핑. 또는 URL 기반 탭 선택 API 추가.

```python
# 제안 API
async with CDP(port=9222, url='monkos.ai/admin') as cdp:  # URL 패턴 매칭
async with CDP(port=9222, title='Blog Editor') as cdp:    # 타이틀 매칭
```

### 🟡 important — 사용성 대폭 개선

#### I1. 드롭다운/서브메뉴 2단계 탐색

**현상**: smart_click('글꼴')로 드롭다운은 열리나, 드롭다운 내부 옵션(나눔고딕, 맑은고딕 등)은 프로파일에 없음.
**원인**: 드롭다운 내부 DOM은 클릭 후에야 생성됨 (동적 렌더링).
**해결**: 드롭다운 클릭 → 짧은 대기 → **재프로파일링** → 내부 옵션 접근. smart_click에 depth=2 옵션 추가.

#### I2. 검색 통합 패턴

**현상**: 기업마당에서 검색어 입력 + 검색 실행을 수동 코딩함.
**원인**: 검색 input의 name이 사이트마다 다름 (keyword, searchKeyword, q 등). 검색 실행 방식도 button submit, form submit, onclick 등 제각각.
**해결**: 프로파일에 **search_input** 태그 자동 부여. type=search 또는 placeholder에 '검색' 포함 input을 자동 식별.

```python
# 제안 API
await cdp.profiler.smart_search('AI 소상공인')  # 검색 필드 자동 탐지 + 입력 + 실행
```

#### I3. 페이지 텍스트 구조화 추출

**현상**: cdp.text()로 전체 텍스트를 가져온 후 줄 단위로 파싱함. 공고 상세의 key-value 테이블이 구조 없이 섞임.
**원인**: text()는 평문만 반환.
**해결**: 프로파일에 **테이블 구조**, **제목-본문 구조**를 포함. 또는 smart_extract() API.

```python
# 제안 API
data = await cdp.profiler.smart_extract()
# → {title: '...', tables: [{key: value}], body: '...', files: [...]}
```

#### I4. 스크롤 + 섹션맵

**현상**: scrollIntoView는 작동하나, "FAQ로 스크롤해줘"를 프로파일 기반으로 처리 못함.
**해결**: 프로파일에 **섹션맵** 추가 — h1~h6, section, [id] 요소의 위치를 기록.

```python
await cdp.profiler.smart_scroll('FAQ')  # 섹션맵에서 찾아 scrollIntoView
```

### 🟢 nice-to-have — 향후 고도화

#### N1. SPA 내부 상태 접근
- Angular (GA4): mat-tree-node 같은 컴포넌트 트리 접근
- React: __REACT_DEVTOOLS_GLOBAL_HOOK__ 활용

#### N2. 다운로드 URL 정규화
- 첨부파일 "다운로드" 링크의 실제 파일명 추출
- hwp/pdf 자동 분류

#### N3. 멀티탭 오케스트레이션
- 4포트 동시 작업 시 탭 간 데이터 전달
- "A 탭에서 추출한 데이터를 B 탭에 입력" 패턴

---

## 4. 속도 체감 솔직 평가

### 극적으로 빠른 것
- **프로파일링 자체**: 3~18ms — 이전 풀스캔 3초 대비 100배+
- **버튼 클릭 정확도**: 100% — 이전 좌표 추론 실패 제로
- **폼 입력**: 필드당 2~4ms — 사람이 한 글자 치는 시간에 전체 폼 완성

### 아직 극적이지 않은 것
- **전체 작업 흐름**: 페이지 이동 2~3초(네트워크) + 프로파일 14ms + 작업 수ms → 병목은 네트워크
- **한 페이지 내 연속 작업**: 여기서 진짜 차이가 남. 어드민에서 폼 전체를 24ms에 채우는 것은 극적
- **처음 보는 외부 사이트**: 프로파일러 덕분에 즉시 구조 파악 가능 — 이전에는 매번 3초 풀스캔

### 결론
**PageProfiler는 Phase 2를 달성했다. Phase 3는 smart_fill 이벤트 내장 + 에디터 자동감지 + tab 안정화가 핵심.**
이 3개만 해결하면 "4포트에서 에이전트가 정신없이 작업하는" 그림이 나온다.

---

## 5. PT 영상 활용 가능한 장면

오늘 테스트에서 촬영 가능한 컷:

| 장면 | 파일 | 임팩트 |
|------|------|--------|
| monkos.ai 프로파일링 9ms | /tmp/mina_monkos.png | 속도 증명 |
| 어드민 블로그 풀 폼 작성 | /tmp/admin_blog_real.png | 에디터 자동 입력 |
| 티스토리 블로그 작성 | /tmp/tistory_written.png | 외부 사이트도 동작 |
| 기업마당 공고 자동 브리핑 | /tmp/biz2_2_detail.png | 정책 정보 자동 수집 |
| 티스토리 버튼 12개 연속 클릭 | (터미널 로그) | 100% 정확도 |
| GSC 실적 데이터 | /tmp/mina_test_monkos.png | 외부 SPA 프로파일링 |

---

## 6. 발견한 공고 (작가님 확인 완료)

오늘 CDP 브리핑 중 발견하여 작가님과 함께 검토한 공고:

| 공고 | 마감 | 적합도 | 비고 |
|------|------|--------|------|
| SaaS 개발/사업화 지원 | 4/22 | ★★★ | AI-Native SaaS, 단독 신청, MONKOS 완벽 매칭 |
| 고성능 컴퓨팅 지원 (GPU) | 4/23 | ★★★ | H100/H200 지원, 자체 모델 파인튜닝 |
| GovTech AI 실증 | 4/23 | ★★ | 컨소시엄 필수 |
| 도메인특화AI모델개발 | 5/7 | ★★★★ | 디딤돌 제안서 업그레이드 버전, AX와 유사 |

---

## 7. 막내 리서치 요청 사항

### R1. smart_fill 프레임워크 호환 — React/Vue/Angular의 state 업데이트를 트리거하는 범용 입력 방식 리서치
### R2. 에디터 자동감지 — TinyMCE/Toast UI/ProseMirror/CKEditor/Quill 등 주요 에디터 감지 + API 호출 패턴 정리
### R3. CDP 탭 관리 안정화 — type='page' 필터링, URL/타이틀 기반 탭 선택, 동적 탭 추적 방안

---

*본 리뷰는 작가님과 민아가 4시간 실전 검증한 결과를 기반으로 작성.*
*PF_CDP Phase 2 달성 확인, Phase 3 진입 준비 완료.*
