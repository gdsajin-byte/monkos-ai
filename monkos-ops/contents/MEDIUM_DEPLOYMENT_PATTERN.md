---
type: pattern
date: 2026-03-22
author: M1/민아
status: confirmed
---

# Medium 외부 배포 패턴

> monkos.ai 블로그 → Medium + LinkedIn 배포 워크플로우

## 전제조건

- monkos.ai 블로그 라우트 라이브 상태 (`/blog/`, `/en/blog/`, `/ja/blog/`)
- Medium 계정 로그인 상태
- LinkedIn 계정 로그인 상태

## URL 규칙

```
monkos.ai 영문 블로그 URL 구조:
https://monkos.ai/en/blog/{원본slug}     ← -en 접미사 없이 원본 slug 사용
https://monkos.ai/ja/blog/{원본slug}     ← -ja 접미사 없이
https://monkos.ai/blog/{원본slug}        ← 한국어 기본

Firestore doc ID와 URL slug 관계:
- Firestore: `claudemax-20x-2개월-실사용-후기-en` (lang별 접미사 포함)
- URL: `/en/blog/claudemax-20x-2개월-실사용-후기` (접미사 제외, 라우트 prefix로 lang 구분)
```

## Medium Import 절차

### Step 1: Import
1. `medium.com/p/import` 접속
2. monkos.ai 영문 URL 입력 (예: `https://monkos.ai/en/blog/{slug}`)
3. "수입" 클릭 → 자동 import

### Step 2: 검수
- 제목·본문·이미지·포매팅 확인
- 중복 단락 있으면 제거
- "Originally published at https://monkos.ai" 자동 삽입 확인 (canonical)

### Step 3: Publish
1. "Publish" 클릭
2. 태그 1~5개 설정 (드롭다운에서 선택)
3. "게시" 클릭

### Step 4: LinkedIn 공유
1. 발행 완료 다이얼로그에서 "LinkedIn에 공유하기" 클릭
2. 소개 문구 (영문, 2~3문장) + 해시태그 5개 입력
3. "Post" 클릭

## 태그 가이드

| 카테고리 | 추천 태그 |
|---------|---------|
| AI/기술 | AI, Startup, Claude Code |
| 창업 스토리 | AI, Startup, Photography |
| 뷰티/헤어 | AI, Photography, Beauty |
| 서비스 가이드 | AI, Startup, Photography |

## 알려진 제한사항

- Medium import 시 한국어 slug 포함 URL: 브라우저 자동화(IME)에서 truncation 발생 가능 → 수동 입력 권장
- Medium 에디터에 JavaScript DOM 직접 조작 시 저장 에러 발생 → JS 삽입 금지, 에디터 내 직접 작업만
- GCS webp 이미지: import 시 일부 로드 실패 가능 → 수동 업로드로 보완
- Medium API Integration Token: 신규 발급 중단 상태 → 브라우저 수동 발행만 가능

## 발행 실적 (2026-03-22)

| # | 제목 | Medium ID | LinkedIn |
|---|------|-----------|----------|
| 1 | Claude MAX 20x ($200/Month): 2-Month Real-World Review | `4ef35ccb58d5` | ✅ |
| 2 | 12 Years Running a Photo Studio: Diving into AI Photo ID App Development | `44001820095a` | ✅ |
