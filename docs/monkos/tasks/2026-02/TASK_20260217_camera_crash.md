---
type: task
from: M1/쌍아
to: 막내(any)
date: 2026-02-17 13:16 KST
status: pending
tags: [camera, crash, debug, blocker]
---

# 막내 지시서: 카메라 충돌 근본 원인 조사

## 배경

2/16 야간 세션에서 develop 코드를 prod(us-central1)에 배포할 때마다 카메라 충돌 발생.
4연속 실패 후 정상 버전(리비전 00079)으로 롤백하여 안정화.

**코드 변경 자체는 정상** — 배포 과정에서 문제 발생.

### 증상

- 배포 후 카메라 시작 시 충돌 (getUserMedia 실패 또는 스트림 중단)
- 동일 코드를 로컬에서 테스트하면 정상 작동
- 3차례 코드 수정 후 재배포해도 동일 증상 반복
- 정상 리비전(00079)으로 롤백하면 즉시 복구

### 관련 커밋

```
0336f1a - 다운로드 UX 개선 5 PHASE 구현
1a46e0e - 버그 수정 3건 (iOS/공유섹션/CSS)
b09462d - 루트 경로 리다이렉트 수정: / → /app
```

## 조사 범위

```
monkos_AI/idphoto-kr/
├── server.js          ← 서버 사이드 (라우트, 미들웨어)
├── public/
│   └── index.html     ← 클라이언트 (카메라 로직)
├── Dockerfile         ← 빌드 설정
└── deploy.sh          ← 배포 스크립트
```

## 조사 항목

### A. 카메라 관련 코드 분석

1. **getUserMedia 호출부** — constraints, 에러 핸들링 전수 조사
   - ideal/max 해상도 설정값
   - facingMode 설정
   - Safari/iOS 특수 처리 여부
2. **스트림 관리** — 시작/중지/재시작 로직
   - 스트림 해제(stop) 누락 가능성
   - 다중 스트림 충돌 가능성
3. **WebSocket 연결** — 카메라와 WS 생명주기 연동
   - WS 연결 실패 시 카메라 영향
   - 재연결 로직

### B. 배포 차이 분석

1. **Dockerfile 점검**
   - 빌드 캐시가 구 버전을 물고 있는지
   - multi-stage build 여부
   - node_modules 설치 방식
2. **deploy.sh 점검**
   - dev/prod 분기 로직
   - 환경변수 전달 방식
   - 이미지 태깅 전략 (latest vs 버전)
3. **Cloud Run 설정**
   - 동시성(concurrency) 설정
   - 메모리/CPU 설정
   - 콜드 스타트 영향

### C. 리비전 비교

1. **정상 리비전(00079)과 충돌 리비전 차이**
   - `gcloud run revisions list --service=monkos-idphoto-kr --region=us-central1` (실행하지 말고 명령만 기록)
   - 환경변수 차이
   - 이미지 해시 차이
2. **코드 diff** — 정상 버전 기준 변경사항 전수 목록
   - `git diff <정상커밋>..HEAD -- monkos_AI/idphoto-kr/`

### D. 가설 검증

| 가설 | 검증 방법 |
|------|----------|
| Docker 캐시가 구 static 파일 물고 있음 | Dockerfile에서 COPY 순서 + .dockerignore 확인 |
| obfuscate.mjs가 코드를 깨뜨림 | obfuscate 설정 파일 확인, 난독화 대상 범위 |
| 환경변수 누락/불일치 | server.js의 process.env 참조 전수 vs 실제 설정값 |
| 콜드 스타트 시 WS 타이밍 이슈 | WS 초기화 로직과 카메라 시작 타이밍 관계 |
| Safari/iOS에서만 발생 | getUserMedia 호출부의 브라우저 분기 확인 |

## 보고 형식

```markdown
---
## 조사 보고 [막내N] [HH:MM KST]

### A. 카메라 코드 분석
| 파일 | 줄 | 내용 | 위험도 |
|------|-----|------|--------|

### B. 배포 차이
| 항목 | 정상(00079) | 현재 | 차이 |
|------|------------|------|------|

### C. 리비전 비교
(git diff 결과 요약)

### D. 가설 판정
| 가설 | 판정 | 근거 |
|------|------|------|

### 근본 원인 (추정)
- 원인: ...
- 재현 조건: ...
- 수정 방안: ...

### 요약
- 🔴 근본 원인: N건
- 🟡 기여 요인: N건
- 🟢 무관: N건
---
```

## 제약

- **코드 수정 금지** — 순수 조사·보고만
- **배포 금지**
- **gcloud 명령 실행 금지** — 명령은 기록만 하고 실행하지 말 것
- 의심스러운 것은 빠짐없이 기록
