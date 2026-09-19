---
type: completion
date: 2026-09-19
device: M2
agent: 쌍아
status: 마감
portfolio: PF_KKU
---

**[2026-09-19 11:38 KST]** M2/쌍아 → 작가님

# monk_studio 메뉴 CTA 전환 — 톡톡상담 → 네이버 간편예약 (블랙 통일)

## 요청 출처

꾸 직접 요청 (M2 현장). ch1 2조 경로④(꾸 기획 + M2/쌍아 기술 지원) 준거.

## 결과

✅ monk_studio 계열 **7개 페이지 메뉴 CTA 전환 완료** — 커밋 `8b165506`
✅ 버튼색 **블랙 통일** (`bg-black` + `hover:bg-gray-800`) — 기존 네이버그린/gray-900 혼재 해소
✅ 푸터·본문 톡톡 문의 창구 **존치** (꾸 확인)
⏳ **CF Pages 배포 미실시** — 작가님 승인 대기
💡 배포 전 라이브 상태: `talk.naver.com` 3건 잔존 / `간편예약` 0건 → 09-19 10:48 커밋(79015055)도 미배포분

## 변경 파일 (7)

| 파일 | 전환 버튼 |
|---|---|
| `MONK_kr/monk_studio/monk_studio.html` | 데스크톱 nav + 모바일 메뉴 (2) |
| `MONK_kr/monk_studio/id_photo/id_photo.html` | 헤더 nav (1) |
| `MONK_kr/monk_studio/family/family.html` | 데스크톱 nav (1) |
| `MONK_kr/monk_studio/profile/profile.html` | 데스크톱 nav (1) |
| `MONK_kr/monk_studio/id_photo/deluxe/deluxe.html` | 헤더 nav (1) |
| `MONK_kr/monk_studio/id_photo/standard/standard.html` | 헤더 nav (1) |
| `MONK_kr/monk_studio/id_photo/premium/premium.html` | 헤더 nav (1) |

## 전환 규격

- href: `https://talk.naver.com/W5UJ45` → `https://m.place.naver.com/place/1454242520/booking`
- 아이콘: `message-circle` → `calendar`
- 문구: `톡톡 상담` / `톡톡 상담하기` → `네이버 간편예약` / `네이버 간편예약하기`
- 색상: `bg-[#03C75A] hover:bg-[#02b351]` · `bg-gray-900 hover:bg-tiffany` → **`bg-black hover:bg-gray-800`**
  - `hover:bg-tiffany`는 monk_studio/family/profile에 hover 변형 미정의 → 코어 Tailwind 블랙으로 통일

## 존치 항목 (의도적 미변경)

- `family.html:369` · `profile.html:351` 푸터 "네이버 톡톡" 링크
- `monk_studio.html:384` · `id_photo.html:341` 본문 연락 섹션 "네이버 톡톡 문의" 버튼
- family/profile 상품 카드 하단 문의 버튼 (amber / deep-sapphire)

## 검증

- diff: 16행 치환 / 16행 삭제, 7파일 (범위 밖 변경 0)
- `<a>`/`</a>` 태그 균형: 7파일 전부 변경 전후 동일 (16/16, 9/9, 10/10, 10/10, 4/4, 4/4, 4/4)
- 로컬 서빙 7페이지 HTTP 200
- 라이브 판정: monk.kr 2회 히트(200/200) — **미배포 상태 확인**이 목적. 배포 후 재측정 필요

## 준수/예외

- ⚠️ **[예외] ch1 "쌍아 직접 코딩 금지"** — 꾸 직접 요청 + 경로④ 기술 지원으로 실행. 작가님 사후 확인 요청
- ch5: 배포 미실시. monk.kr CF Pages는 자동빌드 OFF이므로 push ≠ 배포 (deploy-cf 3단계)

## 남은 일

1. 작가님 승인 후 배포: `npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true` (프로젝트 루트에서)
2. 배포 후 라이브 2회 히트 재측정 — `간편예약` ≥1 / 메뉴 `talk.naver` 0 확인
