---
type: completion
date: 2026-07-18
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: T1 비백색국 배경 재채색 + 블로그 URL 정본화

**[2026-07-18 19:19 KST]** iMac/막내2 → 작가님

## A: T1 비백색국 배경 재채색

### ✅ 1. matte.js runMatteChain export
- `async function` → `export async function`

### ✅ 2. server.js T1 재채색 분기
- T1 재크롭 성공 후 `getSpecBgColor(slug) !== '#FFFFFF'`이면 `runMatteChain` 호출
- 매트 실패 시 흰배경 유지 (잠정 폴백)

### ✅ 3. gray T1 비노출 해제
- render-specs.js: grayBg 판정 삭제 → `t1RetouchOn = env` 단순화
- 전 슬러그 T1 허용 (재채색 보장)

## B: 블로그 URL 정본화

### ✅ 1. 변형 슬러그 301 리다이렉트
- `/blog/{slug}-(kr|en|ja)` → 베이스 레코드 존재 확인 후 301
- `-kr` → `/blog/{base}`, `-en` → `/en/blog/{base}`, `-ja` → `/ja/blog/{base}`

### ✅ 2. SEO_TITLE_OVERRIDES 키 정정
- `vol38-ai-kr` → `vol38-ai`, `ai-kr` → `ai`

### ✅ 3. redirect 반환 처리
- `renderBlogPost`에서 `parts.redirect` 감지 시 301 응답

## 라이브 확인

| 항목 | 결과 |
|------|------|
| /blog/vol38-ai-kr | ✅ 301 → /blog/vol38-ai |
| /blog/ai-kr | ✅ 301 → /blog/ai |
| KZ T1 | ✅ `t1: true` (재채색 보장) |

## 배포

portal rev **00508-cv6** · jest 105/105
