# 🔧 MONK AI Studio Pro - 문제 해결 기록
**날짜**: 2026년 1월 11일  
**작업 시간**: 약 6시간  
**최종 상태**: ✅ 완전 해결

---

## 📋 목차
1. [문제 발생 배경](#문제-발생-배경)
2. [증상](#증상)
3. [문제 해결 과정](#문제-해결-과정)
4. [최종 해결 방법](#최종-해결-방법)
5. [적용된 변경사항](#적용된-변경사항)
6. [교훈 및 향후 대응](#교훈-및-향후-대응)

---

## 🚨 문제 발생 배경

### 초기 상황
- 아침에 MONK AI Studio Pro 앱이 정상 작동함
- 이미지 생성(T2I) 및 변주(I2I/Edit/Upscale) 모든 기능 정상
- 얼굴 인상 고정 + 다양한 변주 + 여러 요소 스택까지 성공적으로 작동

### 문제 발생 시점
- 점심 이후 앱 재실행 시 변주 기능에서 에러 발생
- 이미지 생성은 정상 작동하나 변주만 계속 실패

---

## 🔴 증상

### 에러 메시지
```
GEMINI API ERROR: 400 - {
  "ERROR": {
    "CODE": 400,
    "MESSAGE": "PROJECT 'PROJECTS/MONK-PRODUCTION-ENTERPRISE' NOT FOUND OR DELETED.",
    "STATUS": "INVALID_ARGUMENT",
    "DETAILS": [{ "TYPE": "TYPE.GOOGLEAPIS.COM/GOOGLE.RPC.ERRORINFO" }]
  }
}
```

### 관찰된 현상
1. ✅ **이미지 생성(T2I)**: 4배치 정상 생성됨
2. ❌ **변주(I2I/Edit/Upscale)**: 위 에러 메시지 반복 발생
3. ❌ API 키를 아무리 교체해도 동일한 에러 발생
4. ❌ 프로젝트 ID를 변경해도 효과 없음

---

## 🔍 문제 해결 과정

### 1단계: API 키 문제로 추정 (1시간)
**시도한 방법:**
- 기존 API 키: `AIzaSyAMT8pvdZcH3034xQT4dCoHv6KTf2eHDow`
- 새 API 키 발급: `AIzaSyBcr2J-hOumENWvHyjFdSLcWANJnv8Kq1o`
- `.env` 파일 수정 및 서버 재시작

**결과:** ❌ 실패 - 동일한 에러 계속 발생

---

### 2단계: 프로젝트 ID 설정 문제로 추정 (2시간)
**발견 사항:**
- 에러 메시지에 `MONK-PRODUCTION-ENTERPRISE` 프로젝트 언급
- 이 프로젝트는 존재하지 않거나 삭제됨

**시도한 방법:**
1. 프로젝트 ID를 `MONKOS`로 설정
2. `quota_project_id` 헤더 강제 설정:
   ```javascript
   const ai = new GoogleGenAI({ 
     apiKey: process.env.GEMINI_API_KEY,
     clientOptions: {
       headers: {
         'X-Goog-User-Project': 'MONKOS'
       }
     }
   });
   ```
3. Google Cloud 프로젝트 목록 확인:
   ```
   monkos (MONKOS) - 933456016842
   ```
4. 프로젝트 ID를 소문자 `monkos`로 수정

**결과:** ❌ 실패 - 여전히 동일한 에러

---

### 3단계: API 키 자체가 삭제된 프로젝트와 연결됨 (1시간)
**가설:**
- 사용 중인 API 키가 `MONK-PRODUCTION-ENTERPRISE` 프로젝트에서 발급되었을 것
- API 키 자체가 삭제된 프로젝트와 바인딩되어 있어서 변경 불가

**시도한 방법:**
1. OAuth 클라이언트 시크릿 파일 적용:
   ```
   client_secret_933456016842-4qghre5mbk3pb5nfgsm0sgr3tan0jvnl.apps.googleusercontent.com.json
   ```
2. `monkos` 프로젝트에서 새 API 키 재발급:
   ```
   AIzaSyCAZjZYSfYhotijoPMMVdiZ7p7avO1FFJc
   ```

**결과:** ❌ 실패 - 새 API 키로도 동일한 에러

---

### 4단계: 백엔드 코드 문제로 추정 (1시간)
**가설:**
- 변주 기능이 잘못된 모델을 사용하고 있을 것
- `gemini-3-pro-image-preview`는 이미지 생성 불가능

**시도한 방법:**
```javascript
// 변경 전 (잘못됨)
model: 'gemini-3-pro-image-preview'  // Vision 모델 (분석만 가능)

// 변경 후
model: 'imagen-3.0-generate-001'     // 이미지 생성 모델
```

**결과:** ❌ 실패 - 원래 코드로 롤백 (아침에 작동했으므로 코드는 문제 없음)

---

### 5단계: 🎯 진짜 원인 발견! (최종 해결)

**결정적 단서:**
```bash
# .env.atelier 파일 확인
VITE_API_URL=https://monk-ai-studio-pro-backend.gdsajin.workers.dev/api
```

**문제의 핵심:**
```
프론트엔드 → Cloudflare Workers (삭제된 프로젝트의 API 키 사용) → ❌ 에러!
             ↑
             여기로 요청이 가고 있었음!

로컬 백엔드 (새 API 키) → 사용되지 않음
```

**왜 아침에는 작동했나?**
- 아침에는 `.env.atelier`가 `localhost:3001`로 설정되어 있었거나
- 다른 환경에서 작업했을 가능성

**왜 생성은 되고 변주는 안 됐나?**
- 생성(T2I)과 변주(I2I) 모두 같은 Cloudflare Workers를 사용
- 하지만 에러 메시지가 변주에서만 표시되었던 이유는 불명확
- 가능성: Workers의 캐싱이나 라우팅 문제

---

## ✅ 최종 해결 방법

### 핵심 수정사항

**1. `.env.atelier` 파일 수정**
```diff
- VITE_API_URL=https://monk-ai-studio-pro-backend.gdsajin.workers.dev/api
+ VITE_API_URL=http://localhost:3001/api
```

**2. 새 API 키 적용**
```bash
# backend/.env
GEMINI_API_KEY=AIzaSyCAZjZYSfYhotijoPMMVdiZ7p7avO1FFJc
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**3. 민감 정보 보호**
```bash
# backend/.gitignore
credentials.json
.env
```

---

## 📦 적용된 변경사항

### 수정된 파일 목록
1. **.env.atelier**
   - API 엔드포인트를 로컬 백엔드로 변경
   
2. **backend/package.json**
   - `@google-cloud/aiplatform` 패키지 추가 (시도 과정에서 설치)
   
3. **vite.config.ts**
   - `host: '0.0.0.0'` → `host: 'localhost'`로 변경
   - 네트워크 인터페이스 에러 해결
   
4. **backend/.gitignore**
   - `credentials.json` 추가
   - API 키 및 민감 정보 보호

### Git 커밋 정보
```
커밋 ID: 1a052d6
제목: fix: 로컬 백엔드로 API 엔드포인트 변경 및 새 API 키 적용
브랜치: main
푸시: ✅ 완료 (GitHub)
```

---

## 💡 교훈 및 향후 대응

### 배운 점

1. **환경 변수 확인의 중요성**
   - 백엔드만 확인하지 말고 **프론트엔드 환경 변수도 반드시 확인**
   - `.env`, `.env.local`, `.env.atelier`, `.env.customer` 모두 체크

2. **에러 메시지의 함정**
   - 에러 메시지가 API 키/프로젝트 문제라고 해서 항상 백엔드 설정만 문제는 아님
   - **요청이 어디로 가는지** 먼저 확인 필요

3. **디버깅 순서**
   ```
   올바른 순서:
   1. 네트워크 트래픽 확인 (어디로 요청이 가는가?)
   2. 환경 변수 확인 (프론트/백 모두)
   3. API 키/인증 정보 확인
   4. 코드 로직 확인
   
   잘못된 순서 (오늘 했던 것):
   1. API 키 교체 시도
   2. 프로젝트 설정 변경
   3. 코드 수정
   4. 환경 변수 확인 (마지막에!)
   ```

4. **"아침에 잘 작동했다" = 코드는 괜찮다**
   - 코드를 먼저 의심하지 말 것
   - 환경/설정 변경사항 먼저 체크

---

### 향후 대응 방안

#### 1. 환경 변수 문서화
```markdown
# 환경 변수 체크리스트

프론트엔드:
- [ ] .env.atelier - VITE_API_URL 확인
- [ ] .env.customer - VITE_API_URL 확인

백엔드:
- [ ] backend/.env - GEMINI_API_KEY 확인
- [ ] backend/.env - PROJECT_ID 확인 (필요시)

확인 사항:
- [ ] 로컬 개발: localhost:3001 사용
- [ ] 프로덕션: Cloudflare Workers URL 사용
```

#### 2. 디버깅 스크립트 작성
```bash
#!/bin/bash
# debug-api.sh

echo "🔍 API 엔드포인트 확인"
echo "프론트엔드 (.env.atelier):"
grep VITE_API_URL .env.atelier

echo -e "\n백엔드 (.env):"
grep GEMINI_API_KEY backend/.env | sed 's/=.*/=***HIDDEN***/'

echo -e "\n현재 실행 중인 서버:"
lsof -ti:3000,3001
```

#### 3. 환경별 설정 명확화
```javascript
// 개발 환경
VITE_API_URL=http://localhost:3001/api

// 스테이징 환경  
VITE_API_URL=https://monk-ai-studio-pro-backend-staging.workers.dev/api

// 프로덕션 환경
VITE_API_URL=https://monk-ai-studio-pro-backend.gdsajin.workers.dev/api
```

#### 4. README에 트러블슈팅 섹션 추가
```markdown
## 🔧 트러블슈팅

### "MONK-PRODUCTION-ENTERPRISE NOT FOUND" 에러
**원인:** 프론트엔드가 잘못된 백엔드를 호출 중
**해결:** .env.atelier의 VITE_API_URL을 확인하고 localhost:3001로 변경

### 이미지 생성은 되는데 변주가 안 됨
**원인:** API 엔드포인트 설정 문제
**해결:** 위와 동일
```

---

## 📊 시간 분석

| 단계 | 소요 시간 | 시도 횟수 |
|------|----------|----------|
| API 키 교체 시도 | 1시간 | 3회 |
| 프로젝트 ID 설정 | 2시간 | 5회 |
| 백엔드 코드 수정 | 1시간 | 2회 |
| 환경 변수 확인 | 30분 | 1회 |
| 최종 해결 | 10분 | 1회 |
| **총 소요 시간** | **약 6시간** | **12회** |

---

## 🎯 핵심 요약

### 문제
프론트엔드가 Cloudflare Workers를 호출 → Workers에 삭제된 프로젝트의 API 키 설정됨 → 에러 발생

### 해결
`.env.atelier`의 `VITE_API_URL`을 `localhost:3001`로 변경 → 로컬 백엔드(새 API 키) 사용

### 교훈
**"백엔드만 보지 말고, 요청이 어디로 가는지부터 확인하라!"**

---

## 🔗 관련 파일

- 트러블슈팅 문서: `TROUBLESHOOTING_20260111.md` (이 파일)
- 환경 설정: `.env.atelier`, `backend/.env`
- 백엔드 서버: `backend/server.js`
- Git 커밋: `1a052d6`

---

**문서 작성일**: 2026년 1월 11일  
**작성자**: AI Assistant (Claude Sonnet 4.5) with MONK Team  
**상태**: ✅ 문제 완전 해결 및 백업 완료

---

> "고생 끝에 낙이 온다. 오늘의 디버깅은 내일의 경험이 된다." 💪✨
