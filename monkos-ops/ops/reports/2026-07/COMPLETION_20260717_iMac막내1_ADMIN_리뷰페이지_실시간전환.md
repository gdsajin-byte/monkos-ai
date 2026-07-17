---
type: completion
date: 2026-07-17
device: iMac
agent: 막내1
status: 완료 (인덱스 생성 필요)
portfolio: PF_CITADEL
---

**[2026-07-17 13:04 KST]** iMac/막내1 → 작가님

# 어드민 ID Photo Review — 실시간 전환 완료 보고

## ✅ 완료 항목

| 항목 | 결과 |
|------|------|
| 데이터소스 GCS→Firestore 전환 | `generations` 컬렉션 쿼리 기반으로 전면 교체 |
| 상품 탭 분기 | KR / JP / Headshot / 전체 4탭 구현 |
| 페이지네이션 (더 보기) | cursor 기반 (`after` 파라미터) — 실측 정상 |
| Cache-Control: no-store | 응답 헤더 추가 |
| 카드 slug/style 표시 | 규격 태그 표시 추가 |
| 기존 라이트박스 유지 | 동작 유지 |
| 테스트 103/103 통과 | 기존 테스트 전수 통과 (리그레션 없음) |

## ⏳ 배포 전 필수: Firestore 복합 인덱스 생성

`service=kr`, `service=jp`, `service=headshot` 탭은 복합 인덱스 필요:

**컬렉션:** `generations`
**필드:** `service ASC` + `createdAt DESC`

생성 링크 (Firebase Console):
```
https://console.firebase.google.com/v1/r/project/monkos/firestore/indexes?create_composite=Ckpwcm9qZWN0cy9tb25rb3MvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2dlbmVyYXRpb25zL2luZGV4ZXMvXxABGgsKB3NlcnZpY2UQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
```

`service=all` 탭은 인덱스 없이 즉시 동작 확인됨.

## 💡 참고사항

- **idphoto-kr/jp 독립 서비스**는 `generations` 미기록 상태. 현재 KR/JP 탭에는 portal(monkos.ai) 경유 생성물만 표시됨.
- 향후 idphoto-kr/jp 서비스에도 generations 기록 추가 시 자동 반영됨.
- KR 필터: slug이 `kr-`로 시작하거나 null(레거시)인 건
- JP 필터: slug이 `jp-`로 시작하는 건

## 📁 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/lib/cms/idphoto-review.js` | 전면 교체 — GCS listing → Firestore query |
| `monkos_AI/portal/public/admin/idphoto-review.html` | 4탭 + 더보기 + slug 태그 추가 |

## 🔀 dev 실측

- `service=all&limit=2`: 정상 반환 (count=2, hasMore=true)
- 페이지네이션: page1 → page2 커서 이동 정상
- 인증: 쿠키 기반 admin 인증 정상 동작
