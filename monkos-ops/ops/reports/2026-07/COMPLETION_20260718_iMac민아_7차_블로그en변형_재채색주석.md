---
type: completion
date: 2026-07-18
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# COMPLETION — 7차: 블로그 -en/-ja 변형 301 완결 + T1 폴백 승인 트레일

**[2026-07-18 19:28 KST]** iMac/민아 → 작가님

> 근거: 작가님 직접 지시(19:26 "7차는 너가 처리하고 세션 마감") — 경로③ 민아 직접 실행 (배포 포함).

## ✅ 실행

1. **render-blog.js** — 변형 301 가드의 en/ja 분기: 접미 언어의 실레코드(`{base}-en/-ja`) 존재 확인 후 `/{lang}/blog/{base}` 301. EN 전용 포스트의 `/blog/{slug}-en` 잔존문(6차 검증 F-잔여①) 봉합.
2. **server.js** — T1 재채색 실패 시 백색 잠정 출고 = **작가님 승인 폴백(07-18) 주석 명기** (무승인 폴백 재발 방지 트레일).

## ✅ 검증

- jest 105/105 (npm test)
- dev(monkos-portal-dev) 스모크 5종 녹색 → **prod 00509-6lq 100%** 스모크 5종 녹색
- 라이브 실측: `-en` 변형 **301 → /en/blog/정본** / `-kr` 변형 회귀 301 / 블로그·specs·홈 200

## 💡 오염 레코드 반전 — 처분 대신 이관 필요 (내일 검수 항목)

`https:monkosaiadminblog-edithtml-kr` 실체 확인(Firestore 읽기): **정상 콘텐츠** "여성 단발머리 취업사진 스타일 3종" (ko·2,700자·published·2026-05-14 발행·GSC 노출 40/클릭 1 발생 중) — 생성 시 슬러그 필드에 어드민 편집 URL이 잘못 입력된 것. **unpublish는 실피해**(살아있는 콘텐츠·트래픽 차단)라 유지 선택. 옳은 처방 = **슬러그 이관** (신규 정상 슬러그로 복제 → 구 레코드 처분 → 301) — 새 슬러그 명명이 콘텐츠·SEO 결정이라 작가님 검수 대기.

## 📁 산출

- 커밋: 7차 fix 1건 (render-blog.js·server.js)
- 변형 URL 정리 최종 상태: **19건 중 19건 처리** (kr 17 + en 1 = 301 완결, 오염 1 = 실체 규명·이관 대기)
