# MONKOS PWA 모바일 앱 구현 세션
**날짜:** 2026-01-30
**담당:** 쌍아 (Claude Sonnet 4.5)
**주제:** monkos.ai를 모바일 앱으로 다운로드 가능하게 PWA 구현

---

## 목표
monkos.ai 웹 서비스를 Progressive Web App (PWA)으로 변환하여 사용자가 모바일 앱처럼 설치하고 사용할 수 있도록 구현

---

## 완료된 작업

### 1. 프로젝트 구조 파악
- **배포 구조 확인**: MONKOS_CHAT_DEPLOYMENT.md 문서 분석
- **두 개의 별도 배포 라인**:
  - monk.kr (MONK_kr 디렉토리)
  - monkos.ai (monkos-ai 별도 레포, Cloudflare Pages 연동)
- MonkosChatApp: Expo React Native 프로젝트 (iOS/Android/Web 멀티플랫폼)

### 2. PWA 기능 구현

#### 2.1 app.json 설정 추가
```json
{
  "expo": {
    "name": "MONKOS Chat",
    "slug": "monkos-chat",
    "platforms": ["web"],
    "web": {
      "name": "MONKOS Chat",
      "shortName": "MONKOS",
      "description": "AI 챗봇 서비스 - Gemini 2.0 Flash 기반",
      "themeColor": "#6366F1",
      "backgroundColor": "#ffffff",
      "display": "standalone",
      "orientation": "portrait",
      "startUrl": "/",
      "scope": "/"
    }
  }
}
```

#### 2.2 앱 아이콘 생성
- **디자인**: M 로고 + 보라색 테마 (#6366F1)
- **파일 생성**:
  - `icon.svg`, `favicon.svg` (벡터 디자인)
  - `icon-192.png`, `icon-512.png` (PWA 필수)
  - `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`
- **생성 스크립트**:
  - `convert_svg_to_png.py` (Python PIL 사용)
  - `generate-icons.js` (Node.js fallback)

#### 2.3 커스텀 설치 버튼 추가 (HomeScreen.js)
```javascript
// beforeinstallprompt 이벤트 감지
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [showInstallButton, setShowInstallButton] = useState(false);

// 설치 버튼 UI
{showInstallButton && Platform.OS === 'web' && (
  <TouchableOpacity onPress={handleInstallClick}>
    <Text>📱 앱으로 설치하기</Text>
  </TouchableOpacity>
)}
```

**기능**:
- Desktop/Android: 브라우저 설치 프롬프트 트리거
- iOS Safari: 수동 설치 안내 메시지

#### 2.4 PWA manifest.json 생성
```json
{
  "name": "MONKOS Chat",
  "short_name": "MONKOS",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6366F1",
  "icons": [
    { "src": "/assets/icon-192.png", "sizes": "192x192" },
    { "src": "/assets/icon-512.png", "sizes": "512x512" }
  ]
}
```

#### 2.5 Service Worker 구현
- **캐싱 전략**: Cache-first with network fallback
- **캐시 파일**: index.html, manifest.json, favicon, 아이콘
- **오프라인 지원**: 기본 페이지 캐싱

#### 2.6 index.html 메타태그 추가
```html
<link rel="manifest" href="/manifest.json" />
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/assets/icon-192.png" />
<script>
  // Service Worker 등록
  navigator.serviceWorker.register('/service-worker.js');
</script>
```

### 3. Git 관리

#### 3.1 monk_project 레포 커밋
```bash
# 2개의 커밋 생성
bde7df8 - PWA 지원 추가 (설정, 스크립트, SVG)
048b0f7 - PWA 아이콘 에셋 (PNG 파일, .gitignore 강제 추가)
93bb4be - 병합 및 충돌 해결

# 푸시
git push origin main
```

#### 3.2 monkos-ai 레포 동기화
```bash
# monkos-ai 레포 클론
git clone git@github.com:gdsajin-byte/monkos-ai.git

# rsync로 MonkosChatApp 동기화
rsync -av --exclude='node_modules' --exclude='dist' \
  MonkosChatApp/ monkos-ai/

# 커밋 및 푸시
0a5e94d - Add PWA support (16 files changed)
git push origin main
```

### 4. 배포 시도

#### 4.1 Cloudflare Pages 자동 배포 트리거
- GitHub webhook → Cloudflare Pages
- 빌드 명령: `npx expo export --platform web`
- Output: `dist/`

#### 4.2 배포 실패
- **Status**: Failed (3:11PM, 45s)
- **실패 단계**: Building application (41s)
- **원인**: 미확인 (빌드 로그 전체 확인 필요)

---

## 미완료 작업

### 1. Cloudflare Pages 빌드 실패 해결
- **필요**: 전체 빌드 로그 확인
- **예상 원인**:
  - 빌드 명령어 설정 오류
  - 환경 변수 누락 (Firebase API 키 등)
  - Node.js 버전 불일치
  - Expo export 실행 오류

### 2. 빌드 후 추가 작업
- manifest.json과 service-worker.js를 dist에 자동 복사
- 빌드할 때마다 index.html 재생성 문제 해결
  - 옵션 1: Expo 빌드 훅 사용
  - 옵션 2: public 디렉토리에 정적 파일 배치
  - 옵션 3: 빌드 후 스크립트로 자동 추가

---

## 기술 스택

- **프론트엔드**: Expo 54.0.32 + React 19.1.0 + React Native Web
- **PWA**: manifest.json + Service Worker
- **배포**: Cloudflare Pages (자동 빌드/배포)
- **Git**: monk_project (메인), monkos-ai (Cloudflare 연동)
- **아이콘**: Python PIL + SVG

---

## 다음 세션 계획

1. **Opus 4.5로 모델 전환**
   - 더 복잡한 문제 해결 능력 필요
   - 빌드 실패 원인 정밀 분석

2. **Cloudflare Pages 빌드 디버깅**
   - 전체 빌드 로그 분석
   - 빌드 설정 확인 및 수정
   - 환경 변수 설정

3. **PWA 자동화**
   - Expo 빌드 프로세스에 PWA 파일 자동 추가
   - CI/CD 파이프라인 개선

---

## 배운 점 / 주의사항

1. **프로젝트 구조 이해 중요**
   - monk_project vs monkos-ai 별도 레포 구조
   - Cloudflare Pages는 monkos-ai만 연동

2. **Expo 빌드 특성**
   - `npx expo export` 시 dist 디렉토리 완전 재생성
   - 수동 추가 파일(manifest, service-worker)은 매번 재추가 필요

3. **.gitignore 관리**
   - PNG 파일 제외되어 있음 → `git add -f` 필요

4. **PWA 요구사항**
   - HTTPS 필수 (Cloudflare Pages 자동 제공)
   - manifest.json + Service Worker + 아이콘
   - iOS는 수동 설치 안내 필요

---

**다음 담당:** 철창 또는 용아 (Opus 4.5)
**작업 상태:** 85% 완료 (배포 실패 해결 필요)
