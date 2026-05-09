---
type: order
date: 2026-04-27
from: iMac/쌍아
to: iMac/막내
subject: 블로그 CMS 파이프라인 전수 진단 — 작성→번역→발행→sitemap→색인 전 구간 오류 패턴 분석
priority: 긴급
pf: PF_PORTAL
phase: 긴급진단
---

# 블로그 CMS 파이프라인 전수 진단

**[2026-04-27 17:55 KST] iMac/쌍아 → iMac/막내**

> 4/27 slug 마이그레이션 과정에서 기존 데이터 잘림(KO 15건, EN 28건, JA 24건)이 발각.
> 이건 마이그레이션 사고가 아니라 CMS 파이프라인 자체의 구조적 문제.
> 다음 단계(콘텐츠→영상 파이프라인, Phase 2.2 등) 진입 전에 인프라 기반 점검 필수.

---

## 1. 목적

블로그 글 1건이 만들어지고 3개국어로 번역되고 검색 엔진에 노출되기까지의 **전 구간 워크플로우를 코드 레벨로 추적**하여:
1. 어디서 데이터가 잘리는가 (본문 잘림 67건의 근본 원인)
2. 어디서 번역이 실패하는가 (Gemini JSON 파싱, 빈 응답, rate limit)
3. 잘린/실패한 데이터가 어떻게 외부로 노출되는가 (sitemap, 색인, 블로그 목록)
4. 각 단계의 에러 핸들링이 존재하는가, 존재하면 작동하는가

---

## 2. 파이프라인 전 구간 추적

### 구간 A: 글 작성 + 저장 (CMS 어드민)

**파일**: `public/admin/js/blog-editor.js` → `POST /api/admin/blog` → `lib/cms/blog.js`

확인 사항:
1. 에디터에서 content를 어떻게 수집하는가 (innerHTML? value? markdown?)
2. POST 요청 시 content 전문이 body에 포함되는가 (크기 제한? truncation?)
3. blog.js `handleBlogCreate`에서 content를 Firestore에 저장할 때 가공이 있는가
4. **content가 잘리는 지점이 있는가** — summary 추출 과정에서 content 덮어쓰기?
5. content 저장 후 Firestore에서 다시 읽어서 검증하는 로직이 있는가

### 구간 B: 자동번역 (translate.js)

**파일**: `lib/cms/translate.js`

확인 사항:
1. Gemini 프롬프트에 content 전문을 보내는가, 잘라서 보내는가
2. `maxOutputTokens: 8192` — 긴 본문(5000자+)이면 응답이 잘릴 수 있는가
3. JSON 응답에서 content 필드 파싱 시 이스케이프 문자 처리
4. `JSON.parse` 실패 시 에러 핸들링 — 현재 catch에서 continue (조용히 스킵)
5. 번역 성공/실패를 원본 doc에 기록하는가 (번역 상태 추적 필드?)
6. 이미지 보존 검증 (112~124행) — content 잘림 시에도 이미지를 복원하는가

### 구간 C: 글 수정 + 재저장 (update 경로)

**파일**: `blog.js` `handleBlogUpdate`

확인 사항:
1. update 시 content가 빈값으로 올 수 있는가 (에디터 버그?)
2. update 시 번역 재트리거 조건 — published + lang=ko일 때만?
3. 기존 content를 update payload의 빈값으로 덮어쓸 가능성

### 구간 D: 블로그 목록 + 상세 렌더링 (render-blog.js)

**파일**: `lib/cms/render-blog.js`

확인 사항:
1. 목록 조회 시 lang 필터 + 중복 제거 로직 정상 동작 확인
2. 상세 조회 시 `-kr` 폴백 + 레거시 slug 폴백 동작 확인
3. content 렌더링 시 마크다운→HTML 변환 과정에서 잘림 가능성

### 구간 E: sitemap 생성 (render-sitemap.js)

**파일**: `lib/cms/render-sitemap.js`

확인 사항:
1. published=true인 모든 글이 sitemap에 포함되는가
2. 본문 잘림(content < 100자)인 글도 sitemap에 포함되는가 → **잘린 글이 색인 요청되는 문제**
3. sitemap에서 slug → URL 변환 시 `-kr` strip 로직 정상 동작

### 구간 F: 자동 색인 요청

**파일**: `blog.js` 154~159행 (Google sitemap ping)

확인 사항:
1. ping URL: `https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml`
2. 이 ping이 발행 시마다 호출되는가
3. 잘린 본문의 글도 ping이 나가는가 → 구글에 잘린 콘텐츠가 색인 요청됨
4. 번역 실패 시에도 ping이 나가는가

---

## 3. 오류 패턴 카탈로그

각 구간에서 발견된 오류를 아래 형식으로 정리:

```
### 오류 패턴 #{N}: {이름}

- **구간**: A/B/C/D/E/F
- **파일:행**: blog.js:122
- **현상**: content가 제목만 저장됨 (60~80자)
- **원인**: (코드 분석 결과)
- **재현 조건**: (어떤 경우에 발생하는가)
- **영향 범위**: KO N건 / JA N건 / EN N건
- **방어 코드 존재 여부**: Y/N
- **수정안**: (구체적 코드 변경)
```

---

## 4. CITADEL 적용도 — SEO에 미친 영향 분석

1. sitemap에 잘린 글이 N건 포함 → 구글이 잘린 본문을 색인 → **thin content 리스크**
2. hreflang에 번역 실패 URL이 포함 → 구글이 "번역본 없음" 판정 → **hreflang mismatch**
3. 오늘 수동 삭제 ~20건 → sitemap에서 제거됨 → 구글이 "페이지 삭제" 감지 → **일시적 색인 감소 (정상 반응)**
4. 301 매핑 35건 추가 → 구 URL → 신 URL 리다이렉트 → **SEO 링크 주스 전달 (긍정적)**

---

## 5. 다음 단계를 위한 설계 제안

진단 결과를 바탕으로 아래 설계안 제시:

### 5-1. CMS 저장 가드레일
- content 저장 시 최소 길이 검증 (200자 미만이면 저장 거부 or 경고)
- 저장 후 Firestore 재조회로 content 정합성 확인

### 5-2. 번역 품질 게이트
- 번역 content가 원본 대비 N% 미만이면 저장 거부 + 에러 로그
- JSON 파싱 방어 (3단계 fallback — 이미 지시서 발행됨)

### 5-3. sitemap 품질 필터
- content < 200자인 글은 sitemap에서 자동 제외
- 번역 미완료 글은 해당 언어 sitemap에서 제외

### 5-4. 운영 대시보드 (선택)
- CMS 어드민에 "본문 잘림 경고" 표시
- 번역 상태(성공/실패/미시도) 표시

---

## 6. 산출물

```
monkos-ops/ops/reports/REPORT_20260427_막내_블로그CMS파이프라인_전수진단.md
```

내용:
1. 파이프라인 전 구간 플로우차트 (코드 경로 명시)
2. 오류 패턴 카탈로그 (구간별)
3. CITADEL SEO 영향 분석
4. 수동 삭제 ~20건 후 현재 상태 스냅샷
5. 다음 단계 설계 제안 (가드레일/게이트/필터)

---

## 완료 보고

```
✅ 파이프라인 6구간 추적 완료
✅ 오류 패턴 N건 발견 (구간별)
✅ CITADEL SEO 영향 분석
✅ 현재 Firestore 상태 스냅샷 (수동 삭제 반영 후)
✅ 설계 제안 N건
📁 보고서 산출
```

---

## ⚠️ 준수 조항

- **코드 수정 금지**: 진단+분석만. 수정은 별도 지시
- **Firestore 변경 금지**: 작가님이 수동 삭제 진행 중. 충돌 방지
- **추가 번역/마이그레이션 트리거 금지**: 진단 완료 전 동결
