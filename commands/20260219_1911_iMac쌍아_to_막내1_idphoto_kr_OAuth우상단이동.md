# 지시서: idphoto-kr /app OAuth 중앙 → 우상단 로그인 탭 이동

[2026-02-19 19:11 KST] iMac/쌍아 → 막내1

## 역할 선언
> **너는 "막내1"이다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식

---

## 배경

idphoto-kr `/app` (촬영 준비실)에 진입하면 카카오/구글 OAuth가 화면 중앙에 끼어들어 있음.
portal(monkos.ai)은 우상단 로그인 탭으로 잘 처리되어 있음.
idphoto-kr도 동일 패턴으로 수정 필요.

## 목표

- `/app` 촬영 준비실은 **비로그인으로 즉시 진입** 가능하도록
- OAuth(카카오/구글)는 **우상단에 로그인 버튼**으로만 존재
- 로그인 후에는 크레딧 뱃지 + 프로필 표시 (portal 패턴)
- 로그인 필요 시점: 결제/다운로드 시에만 팝업으로 요청

## 작업

**파일:** `monkos_AI/idphoto-kr/public/index.html`

1. 현재 중앙에 있는 OAuth 로그인 UI(카카오/구글 버튼)를 **제거 또는 숨김**
2. 상단 헤더(탑바) 영역에 로그인 버튼 추가
   - 비로그인: `로그인` 텍스트 버튼
   - 로그인 후: 기존 크레딧 뱃지 + 프로필 아이콘
3. 촬영 준비실(규격/성별/나이 선택)은 로그인 없이 바로 보이도록

**참고:** portal(monkos.ai) index.html의 헤더 로그인/비로그인 분기 패턴을 참고할 것.

## 주의사항

- server.js 수정 금지
- 기존 OAuth 콜백 라우트 (`/auth/kakao`, `/api/auth/google`) 유지
- JS의 OAuth 함수 자체는 유지 — UI 위치만 이동
- 촬영/생성/코칭 관련 로직 절대 건드리지 말 것

## 배포

```bash
git add monkos_AI/idphoto-kr/public/index.html
git commit -m "[design] idphoto-kr OAuth 중앙 → 우상단 로그인 탭 이동"
git push origin develop
./deploy.sh dev idphoto-kr
```

## 검증

- [ ] `/app` 접속 → 비로그인 상태에서 촬영 준비실 바로 보임
- [ ] 우상단에 로그인 버튼 표시
- [ ] 로그인 버튼 클릭 → 카카오/구글 선택 가능
- [ ] 로그인 후 → 크레딧 뱃지 표시
