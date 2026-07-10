---
type: order
date: 2026-07-10
device: iMac
agent: 쌍아
recipient: 막내
subject: "idphoto-kr/jp 유입 경로 추적 — referrer 저장 + GA4 User-ID 연동"
priority: 보통
portfolio: PF_CITADEL
---

# idphoto-kr/jp 유입 경로 추적

**[2026-07-10 13:38 KST]** iMac/쌍아 → 막내

## 배경

고객360에서 177명의 가입 회원을 확인했으나, 각 유저가 **어디서 유입되었는지** Firestore에 기록이 없음. GA4 세션과 Firestore 유저가 연결되지 않아 유입→가입→생성→결제 전체 퍼널 분석 불가.

## 목표

1. 가입 회원의 유입 경로를 Firestore 유저 문서에 기록
2. GA4 익명 세션과 가입 회원을 연결 (User-ID)

## 작업 내용

### 1. 랜딩 시 referrer + UTM 캡처 (클라이언트)

페이지 최초 로드 시 `sessionStorage`에 저장. OAuth 리다이렉트 왕복에도 살아남도록 **이미 있으면 덮어쓰지 않음**.

```js
// index.html 또는 앱 초기화 시점 (GA4 태그 이후)
if (!sessionStorage.getItem('landing_referrer')) {
  sessionStorage.setItem('landing_referrer', document.referrer || 'direct');
  sessionStorage.setItem('landing_url', location.href);
}
```

- `document.referrer`: 이전 페이지 URL (구글, 네이버, specs 등)
- `location.href`: 랜딩 URL (UTM 파라미터 포함)

### 2. 가입/로그인 시 Firestore 유저 문서에 저장

유저 문서 생성/업데이트 시 아래 필드 추가:

```js
{
  // 기존 필드 유지...
  acquisition: {
    referrer: sessionStorage.getItem('landing_referrer') || null,
    landing_url: sessionStorage.getItem('landing_url') || null,
    first_visit: new Date().toISOString()
  }
}
```

**주의사항:**
- `acquisition` 필드는 **최초 가입 시에만** 기록. 재로그인 시 덮어쓰지 않음 (`if (!userData.acquisition)` 가드)
- portal `server.js:157~173`의 UTM 수집 패턴 참고 (서버사이드지만 필드 구조 동일)

### 3. GA4 User-ID 연동

로그인 성공 시 Firebase Auth uid를 GA4에 전달:

```js
// 로그인/가입 콜백에서
gtag('config', 'G-XXXXXXXXX', {
  user_id: user.uid
});
```

- GA4 측정 ID는 기존 index.html의 gtag 설정에서 확인
- 이 연동으로 가입 전 익명 방문 세션과 가입 후 행동이 GA4에서 하나의 유저 타임라인으로 연결됨

### 4. 적용 대상

- **idphoto-kr**: 필수
- **idphoto-jp**: 동일 적용

## ⚠️ 준수 조항

- 배포는 `deploy.sh` 경유 필수 (ch5 2조)
- 쿠키/로컬스토리지로 비가입자 추적 금지 — `sessionStorage`만 사용 (탭 종료 시 자동 삭제)
- 개인정보(이메일, 이름 등)를 GA4에 전송 금지 — `user_id`에 uid만 전달
- 기존 로그인/가입 로직 변경 최소화 — 저장 코드 추가만

## 완료 기준

- [ ] idphoto-kr 랜딩 시 sessionStorage에 referrer + landing_url 저장 확인
- [ ] 신규 가입 시 Firestore 유저 문서에 `acquisition` 필드 기록 확인
- [ ] 재로그인 시 `acquisition` 필드 미덮어쓰기 확인
- [ ] GA4 User-ID 연동 — GA4 실시간 리포트에서 user_id 확인
- [ ] idphoto-jp 동일 적용
- [ ] dev 배포 후 테스트 (시크릿 모드로 신규 가입 시뮬레이션)
- [ ] COMPLETION 보고서 작성
