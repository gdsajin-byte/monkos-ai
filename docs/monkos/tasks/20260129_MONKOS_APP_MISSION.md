# 🌙 야간 미션: MONKOS Chat 앱 기초 구축

**미션 코드명:** DANGEROUSLY_FORWARD
**실행 환경:** Windows Track 2 (4060)
**실행 시간:** 2026-01-29 19:00 ~ 2026-01-30 07:00
**작전 모드:** ⚡ 데인져러스 - 막히면 스킵, 결과 우선

---

## 🎯 미션 목표

Google 풀스택으로 MONKOS Chat 모바일 앱 기초를 구축하고, 구글 바우처 퀘스트 준비를 완료한다.

**최종 산출물:**
- Firebase 프로젝트 연동 완료
- Vertex AI LLaMA 4 활성화 및 테스트
- React Native 앱 기본 구조
- 세션 로그 자동 생성

---

## ⚠️ 작전 규칙 (데인져러스 모드)

### 황금률
1. **막히면 스킵하고 다음으로**
2. **에러 나도 일단 진행**
3. **결과 우선, 완벽함은 나중에**
4. **모든 진행 상황 자동 로깅**

### 실행 원칙
- 설치/설정이 5분 넘게 막히면 → 스킵하고 다음
- 에러가 크리티컬하지 않으면 → 무시하고 진행
- 성공 여부를 체크포인트 파일에 기록
- 실패한 항목은 아침에 사람이 처리

---

## 📋 미션 체크리스트

### Phase 1: Firebase 프로젝트 셋업 (30분)

```bash
# 목표: Firebase 프로젝트를 monkos GCP 프로젝트에 연결

[ ] 1-1. Firebase Console 접속
    - https://console.firebase.google.com/
    - "프로젝트 추가" 또는 기존 프로젝트 선택

[ ] 1-2. GCP 프로젝트 연결
    - 기존 GCP 프로젝트 선택: "monkos"
    - Firebase 기능 활성화

[ ] 1-3. Firebase CLI 설치 (이미 있으면 스킵)
    npm install -g firebase-tools

[ ] 1-4. Firebase 로그인
    firebase login

[ ] 1-5. Firebase 프로젝트 초기화
    cd C:\monk_project  # 또는 실제 경로
    firebase init

    선택 항목:
    - Firestore
    - Functions
    - Hosting
    - Storage

[ ] 1-6. 체크포인트 기록
    - checkpoint.log에 성공/실패 기록
```

**⚠️ 트러블슈팅:**
- Firebase CLI 설치 실패 → 스킵, 웹 콘솔로만 작업
- 로그인 실패 → 수동 인증 시도, 안되면 스킵
- 초기화 실패 → 일부만 선택하고 진행

---

### Phase 2: Vertex AI LLaMA 4 활성화 (20분)

```bash
# 목표: Vertex AI에서 LLaMA 4 모델 활성화

[ ] 2-1. Vertex AI API 활성화 (이미 되어있을 수 있음)
    gcloud services enable aiplatform.googleapis.com --project=monkos

[ ] 2-2. Model Garden 접속
    - https://console.cloud.google.com/vertex-ai/model-garden?project=monkos
    - LLaMA 4 검색

[ ] 2-3. LLaMA 4 모델 활성화
    - "Enable" 또는 "Deploy" 클릭
    - 리전: us-central1 (기존 Imagen과 동일)

[ ] 2-4. 간단한 테스트 (Python)
    코드는 아래 참조

[ ] 2-5. 체크포인트 기록
```

**테스트 코드:**
```python
# test_llama4.py
from google.cloud import aiplatform

aiplatform.init(project="monkos", location="us-central1")

# 간단한 프롬프트 테스트
prompt = "Hello, MONKOS!"
# TODO: LLaMA 4 endpoint 연결 테스트
print("LLaMA 4 test completed")
```

**⚠️ 트러블슈팅:**
- Model Garden에 LLaMA 4 없음 → 다른 MaaS 모델(Gemini) 사용
- Deploy 실패 → 스크린샷 찍고 스킵
- API 호출 실패 → 활성화만 하고 테스트는 나중에

---

### Phase 3: React Native 프로젝트 생성 (40분)

```bash
# 목표: MONKOS Chat 앱 기본 구조 생성

[ ] 3-1. Node.js 버전 확인 (18+ 필요)
    node --version

[ ] 3-2. React Native CLI 설치
    npm install -g react-native-cli
    # 또는 Expo 사용
    npm install -g expo-cli

[ ] 3-3. 프로젝트 생성
    cd C:\monk_project\apps
    npx react-native init MonkosChat
    # 또는
    expo init MonkosChat

[ ] 3-4. 기본 디렉토리 구조 생성
    cd MonkosChat
    mkdir -p src/screens src/components src/services src/utils

[ ] 3-5. 기본 화면 파일 생성 (템플릿)
    - src/screens/ChatScreen.js
    - src/screens/HomeScreen.js
    - src/components/ChatBubble.js
    - src/services/vertexAI.js

[ ] 3-6. package.json 의존성 추가
    npm install @react-native-firebase/app
    npm install @react-native-firebase/auth
    npm install @react-native-firebase/firestore
    npm install axios

[ ] 3-7. 앱 실행 테스트
    npx react-native run-android
    # 또는
    expo start

[ ] 3-8. 체크포인트 기록
```

**⚠️ 트러블슈팅:**
- React Native 초기화 실패 → Expo로 대체
- 의존성 설치 오류 → 일부만 설치하고 진행
- Android 실행 실패 → iOS 시뮬레이터 또는 웹으로 테스트
- 전부 실패 → 폴더 구조만 만들고 다음 단계로

---

### Phase 4: Firebase 연동 코드 작성 (30분)

```bash
# 목표: Firebase 연결 코드 작성

[ ] 4-1. Firebase 설정 파일 다운로드
    - Firebase Console에서 google-services.json (Android)
    - GoogleService-Info.plist (iOS)
    - apps/MonkosChat/android/app/에 배치

[ ] 4-2. Firebase 초기화 코드 작성
    - src/config/firebase.js

[ ] 4-3. Vertex AI 서비스 파일 작성
    - src/services/vertexAI.js
    - image.monkos.ai API 호출 코드

[ ] 4-4. 기본 채팅 화면 구현
    - src/screens/ChatScreen.js
    - 간단한 UI만

[ ] 4-5. 체크포인트 기록
```

**Firebase 초기화 템플릿:**
```javascript
// src/config/firebase.js
import { initializeApp } from '@react-native-firebase/app';

const firebaseConfig = {
  projectId: 'monkos',
  // ... 나머지 설정
};

const app = initializeApp(firebaseConfig);
export default app;
```

**⚠️ 트러블슈팅:**
- 설정 파일 다운로드 실패 → 수동으로 작성
- 빌드 오류 → 코드만 작성하고 빌드는 스킵
- 연결 테스트 실패 → 코드 작성만 완료

---

### Phase 5: 문서화 및 세션 로그 (20분)

```bash
# 목표: 작업 내용 정리 및 세션 로그 생성

[ ] 5-1. 작업 체크포인트 파일 읽기
    - checkpoint.log 확인

[ ] 5-2. 세션 로그 작성
    - docs/corpus/sessions/2026-01/20260130_session.md
    - 완료된 작업, 실패한 작업, 다음 단계 정리

[ ] 5-3. README 업데이트
    - apps/MonkosChat/README.md
    - 설치 방법, 실행 방법 작성

[ ] 5-4. 스크린샷 캡처 (가능하면)
    - Firebase Console
    - Vertex AI Console
    - 앱 실행 화면

[ ] 5-5. Git 커밋
    git add .
    git commit -m "야간 작업: MONKOS Chat 앱 기초 구축"
    git push

[ ] 5-6. 최종 체크포인트 기록
```

---

## 📝 체크포인트 시스템

### checkpoint.log 형식

```
[2026-01-29 19:05] START - Phase 1: Firebase 셋업
[2026-01-29 19:15] SUCCESS - Firebase CLI 설치 완료
[2026-01-29 19:20] SKIP - Firebase 초기화 실패 (timeout)
[2026-01-29 19:25] SUCCESS - Firebase 웹 콘솔 설정 완료
[2026-01-29 19:30] END - Phase 1 완료 (3/4 성공)

[2026-01-29 19:35] START - Phase 2: Vertex AI LLaMA 4
...
```

### 자동 로깅 스크립트

```bash
# log_checkpoint.sh
#!/bin/bash

LOG_FILE="checkpoint.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

log_start() {
    echo "[$TIMESTAMP] START - $1" >> $LOG_FILE
}

log_success() {
    echo "[$TIMESTAMP] SUCCESS - $1" >> $LOG_FILE
}

log_skip() {
    echo "[$TIMESTAMP] SKIP - $1" >> $LOG_FILE
}

log_error() {
    echo "[$TIMESTAMP] ERROR - $1" >> $LOG_FILE
}

log_end() {
    echo "[$TIMESTAMP] END - $1" >> $LOG_FILE
    echo "" >> $LOG_FILE
}
```

---

## 🎯 성공 기준

### 최소 성공 (60% 달성)
- [ ] Firebase 프로젝트 연결 완료 (웹 콘솔이라도)
- [ ] Vertex AI LLaMA 4 활성화 (또는 다른 MaaS 모델)
- [ ] React Native 프로젝트 폴더 구조 생성

### 표준 성공 (80% 달성)
- [ ] 위 + Firebase 연동 코드 작성
- [ ] 위 + 기본 채팅 UI 구현
- [ ] 위 + 세션 로그 작성

### 완벽 성공 (100% 달성)
- [ ] 위 + 앱 실행 성공 (시뮬레이터/에뮬레이터)
- [ ] 위 + Firebase 연결 테스트 성공
- [ ] 위 + Vertex AI API 호출 테스트

---

## 📚 참고 자료

### Firebase
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)

### Vertex AI
- [Vertex AI 문서](https://cloud.google.com/vertex-ai/docs)
- [Model Garden](https://cloud.google.com/vertex-ai/docs/model-garden/explore-models)

### React Native
- [React Native 공식 문서](https://reactnative.dev/)
- [Expo 문서](https://docs.expo.dev/)

---

## 🚨 긴급 연락

### 막혔을 때
1. 5분 고민 → 스킵
2. 구글 검색 5분 → 스킵
3. 체크포인트 로그에 기록하고 다음으로

### 크리티컬 이슈
- Firebase 프로젝트 삭제/손상 → 즉시 중단, 로그 남기기
- GCP 계정 문제 → 즉시 중단
- 기타 모든 이슈 → 로그 남기고 계속 진행

---

## 🎁 보너스 미션 (선택)

시간이 남으면:

- [ ] HelloWorld XL v7 다운로드 시작 (백그라운드)
- [ ] Google Cloud 자격증 공부 자료 정리
- [ ] MONKOS 런칭 로드맵 상세화
- [ ] monkos.ai 랜딩 페이지 디자인 스케치

---

## 📊 예상 타임라인

```
19:00 - 19:30  Phase 1: Firebase 셋업
19:30 - 19:50  Phase 2: Vertex AI LLaMA 4
19:50 - 20:30  Phase 3: React Native 프로젝트
20:30 - 21:00  Phase 4: Firebase 연동 코드
21:00 - 21:20  Phase 5: 문서화
21:20 - 22:00  버퍼 시간 / 보너스 미션

22:00 - 07:00  자동화 작업 (있다면) / 휴식
```

---

## ✅ 마무리 체크리스트

작업 완료 전에 확인:

- [ ] checkpoint.log 파일 존재
- [ ] 세션 로그 작성 완료
- [ ] Git 커밋 & 푸시 완료
- [ ] 실패한 항목 명확히 기록
- [ ] 다음 단계 TODO 작성

---

**작전 코드:** DANGEROUSLY_FORWARD
**상태:** 🟢 READY TO EXECUTE
**담당:** 4060 (Track 2 - Windows)
**생성:** 2026-01-29 18:00 by 쌍아 (Mac Track 1)

**Let's ship it! 🚀**
