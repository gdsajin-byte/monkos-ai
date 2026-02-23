---
type: task
from: 쌍아
to: 막내 1호, 막내 2호
date: 2026-02-17 14:05 KST
status: pending
tags: [camera, crash, rootcause, blocker, critical]
---

# 막내 지시서: 카메라 충돌 근본 원인 전수조사

## 배경

00079 리비전(2/16 09:35) 이후 **7회 연속 배포 실패** — 코드 변경 내용과 무관하게 100% 카메라 오류.
난독화 ON/OFF, 해상도 변경/원복, UX 코드 추가/미추가 모두 동일 증상.

**핵심 질문: 00079에서 작동하고, 00080~00085에서 깨지는 진짜 차이는 무엇인가?**

### 실패 타임라인

| 리비전 | 빌드 시각 | 코드 변경 | 난독화 | 결과 |
|--------|----------|----------|--------|------|
| 00079-tpk | 2/16 09:35 | deploy.sh 구축 직후 | ON (CFG ON) | ✅ |
| 00080-rwt | 2/16 17:10 | 헤더 DOM 삭제 | ON (CFG ON) | ❌ |
| 00081-58g | 2/16 21:31 | UX 애니 + 버그수정 | ON (CFG ON) | ❌ |
| 00082-xjj | 2/16 21:48 | / → /app 리다이렉트 | ON (CFG ON) | ❌ |
| 00083-wnz | 2/17 13:46 | sharp삭제+CFG OFF | ON (CFG OFF) | ❌ |
| 00084-qm2 | 2/17 13:51 | 난독화 완전 제거 | **OFF** | ❌ |
| 00085-947 | 2/17 14:00 | constraint 720x960 원복 | **OFF** | ❌ |

---

## 막내 1호: 00079 리비전 이미지 역분석

### 목표
00079에 실제 배포된 파일과 현재 로컬 코드의 차이를 완전히 파악한다.

### 작업

#### 1-A. 00079 빌드 시점 코드 특정

```bash
# 00079가 빌드된 정확한 커밋 특정
# deploy.sh가 e56c31b에서 만들어졌고, 00079가 09:35에 빌드됨
# 그 시점의 git log에서 idphoto-kr 관련 마지막 커밋 찾기
git log --before="2026-02-16T09:35:00+09:00" --oneline -- monkos_AI/idphoto-kr/ | head -10
```

#### 1-B. 00079 시점 코드 vs 현재 코드 diff (idphoto-kr만)

```bash
# 위에서 찾은 커밋 해시를 BASE로 사용
git diff <BASE_COMMIT>..HEAD -- monkos_AI/idphoto-kr/server.js
git diff <BASE_COMMIT>..HEAD -- monkos_AI/idphoto-kr/public/index.html
git diff <BASE_COMMIT>..HEAD -- monkos_AI/idphoto-kr/package.json
git diff <BASE_COMMIT>..HEAD -- monkos_AI/idphoto-kr/Dockerfile
git diff <BASE_COMMIT>..HEAD -- monkos_AI/idphoto-kr/.dockerignore
```

#### 1-C. 변경사항 분류

모든 diff를 아래 카테고리로 분류:

| 카테고리 | 카메라 영향 | 예시 |
|----------|-----------|------|
| 카메라 직접 | 높음 | getUserMedia, video 관련 |
| JS 구조 | 높음 | 새 함수 추가, 기존 함수 수정 (파싱 에러 시 전체 사망) |
| CSS/HTML | 낮음 | 스타일, DOM 구조 |
| 서버 | 낮음 | server.js 라우트, 미들웨어 |
| 빌드 | 중간 | Dockerfile, package.json |

#### 1-D. 가장 의심스러운 변경 Top 3 도출

각 변경에 대해:
- 정확한 파일, 줄번호
- 왜 카메라에 영향을 줄 수 있는지
- 검증 방법 제안

---

## 막내 2호: 빌드 환경 + 의존성 전수조사

### 목표
"동일 코드라도 빌드 타이밍에 따라 결과가 달라지는가?"를 검증한다.

### 작업

#### 2-A. package.json + lock 파일 상태

```bash
# package-lock.json이 .gitignore에 있는지 확인
grep "package-lock" /Users/developer/monk_project/.gitignore

# 로컬에 lock 파일 존재 여부
ls -la monkos_AI/idphoto-kr/package-lock.json 2>/dev/null

# package.json 의존성 버전 범위 확인 (^ 또는 ~ 사용 여부)
cat monkos_AI/idphoto-kr/package.json
```

**핵심**: `package-lock.json`이 없으면 매 `npm install`마다 다른 버전이 설치됨.
00079 빌드 시와 현재 빌드 시 의존성 버전이 다를 수 있음.

#### 2-B. Docker 베이스 이미지 변화

```bash
# 현재 node:20-slim의 실제 버전 확인
docker pull node:20-slim 2>/dev/null
# (Docker 없으면 Docker Hub API로 확인)
```

00079 빌드(2/16 09:35)와 현재(2/17 14:00) 사이에 `node:20-slim` 태그가 가리키는 이미지가 변경되었을 수 있음.

#### 2-C. Cloud Build 로그 비교

아래 명령어를 **기록만** 한다 (실행하지 않되, 작가님이 실행할 수 있도록):

```bash
# 00079 빌드 로그 (빌드 ID 필요)
gcloud builds list --limit=10 --filter="images~monkos-idphoto-kr"

# 특정 빌드 상세
gcloud builds describe <BUILD_ID>
```

#### 2-D. 환경변수 비교

```bash
# 현재 Cloud Run 서비스의 환경변수 (00079 리비전)
gcloud run revisions describe monkos-idphoto-kr-00079-tpk \
  --region us-central1 --format 'yaml(spec.containers[0].env)'

# 최신 리비전의 환경변수
gcloud run revisions describe monkos-idphoto-kr-00085-947 \
  --region us-central1 --format 'yaml(spec.containers[0].env)'
```

#### 2-E. 의존성 트리 비교 방안

현재 코드로 로컬에서 `npm install`을 실행하고, 주요 패키지 버전을 기록:

```bash
cd monkos_AI/idphoto-kr
npm install --only=production
npm ls --depth=0
```

특히 `@google/genai` 버전이 중요 — Gemini Live 관련 WebSocket 코드에 영향.

#### 2-F. Dockerfile 분석

00079 시점의 Dockerfile vs 현재 Dockerfile 비교:
- multi-stage 유무
- COPY 순서
- npm install 옵션
- 환경변수

---

## 보고 형식

```markdown
---
## 조사 보고 [막내N호] [HH:MM KST]

### 핵심 발견

🔴 근본 원인 (확정/추정): ...
🟡 기여 요인: ...
🟢 무관 확인: ...

### 상세 분석

(각 조사 항목별 결과)

### 검증 실험 제안

| 실험 | 방법 | 예상 결과 |
|------|------|----------|

### 즉시 적용 가능한 수정

1. ...
2. ...
---
```

## 제약

- **코드 수정 금지** — 조사·분석·보고만
- **배포 금지**
- **gcloud 명령 중 리비전 describe는 실행 가능**, 그 외 변경 명령 금지
- 00079와 현재 코드의 diff가 핵심 — 빠짐없이 분석
