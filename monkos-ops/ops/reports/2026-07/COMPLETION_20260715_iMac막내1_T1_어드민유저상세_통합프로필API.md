---
type: completion
date: 2026-07-15
device: iMac
agent: 막내1
portfolio: PF_PORTAL
subject: T1 — 어드민 유저 상세 페이지 + 통합 프로필 API + 대시보드 유입경로 보강
status: 완료
order: ORDER_20260715_iMac쌍아_막내_T1_어드민유저상세_통합프로필API.md
---

# COMPLETION — T1 어드민 유저 상세 + 통합 프로필 API

**[2026-07-15 14:28 KST]** iMac/막내1 → 작가님

---

## 결과

✅ `dashboard.js` — `handleDashboardUserDetail` 함수 추가 (4소스 조인: Firestore users/transactions/generations + BQ events)
✅ `dashboard.js` — `handleDashboardUsers360` 보강 (signupSource, referrer 필드 추가)
✅ `server.js` — `/api/admin/dashboard/user/:userId` 라우트 등록
✅ `admin/user.html` — 유저 상세 페이지 신규 (프로필·유입경로·퍼널·갤러리·거래내역·BQ 타임라인)
✅ `admin/dashboard.html` — 유입경로 컬럼 추가 + 행 클릭→user.html 이동 (사이드패널 코드 보존)
✅ dev 배포 (rev 00129-5ws) + prod 배포 (rev 00480-ptx)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/dashboard.js` | `handleDashboardUserDetail` 추가 + users360에 signupSource/referrer 추가 + Storage import |
| `monkos_AI/portal/server.js` | import + `/api/admin/dashboard/user/:userId` 라우트 추가 |
| `monkos_AI/portal/public/admin/user.html` | 신규 — 유저 상세 페이지 |
| `monkos_AI/portal/public/admin/dashboard.html` | 유입경로 컬럼 + 클릭 핸들러 변경 (사이드패널 보존) |

## 배포

- dev: `monkos-portal-dev` rev 00129-5ws
- prod: `monkos-portal` rev 00480-ptx

## 기능 상세

### 통합 프로필 API
- Firestore users → 프로필 + acquisition 정보
- Firestore transactions → 최근 50건 거래 내역
- Firestore generations → 최근 50건 + GCS 서명 URL(1h 만료)
- BQ events → 90일 이내 유저 동선 200건 (identity_map 조인)

### 유저 상세 페이지
- 프로필 카드: 이름/이메일/채널/가입일/크레딧/결제 총액
- 유입 경로: referrer/랜딩/가입경로/첫방문
- 퍼널 진행: 5단계 시각화 (방문→가입→생성→결제→다운로드)
- 생성 갤러리: 원본-결과 페어 이미지 (서명 URL)
- 거래 내역 + BQ 동선 타임라인

### 대시보드 보강
- User 360° 테이블에 유입경로 컬럼 추가
- 행 클릭 → `/admin/user.html?id={userId}` 이동

## 준수 조항 확인

1. ✅ 기존 dashboard.html 최소 변경 — 유입경로 컬럼 + 클릭 핸들러만
2. ✅ 사이드패널 코드 보존
3. ✅ GCS 서명 URL — 조회 시점 생성, Firestore 미저장
4. ✅ BQ 파티션 필터 — `event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)` 포함
5. ✅ 시크릿 비노출
6. ✅ deploy.sh prod 경유
