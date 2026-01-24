# 🔧 Claude Code 설정 가이드 (2026-01-24)

**목적**: Cursor에서 Claude Code를 통해 Opus 4.5 무제한 사용 + 빌링 확인

---

## ✅ 현재 상태 확인

### 1. Claude Code 설치 확인

```bash
# 설치 확인
find ~/Library/Application\ Support/Cursor -name "*claude-code*"
```

**결과**: ✅ 설치됨
- 위치: `~/Library/Application Support/Cursor/logs/.../Anthropic.claude-code`
- 버전: `anthropic.claude-code-2.1.19-darwin-x64`

---

## 🔑 Claude Max API 키 연결

### 2. Cursor Settings 확인

**경로**: `Cmd + ,` (Settings) → Extensions → Claude Code

**확인 사항**:
- [ ] Claude Code 확장 활성화 여부
- [ ] Claude Max API 키 연결 여부
- [ ] Opus 4.5 모델 선택 여부

### 3. API 키 설정 방법

1. **Claude.ai에서 API 키 발급**
   - https://console.anthropic.com/settings/keys
   - Claude Max 구독 계정으로 로그인
   - "Create Key" 클릭
   - API 키 복사

2. **Cursor에 API 키 입력**
   - Cursor Settings → AI Models → Claude API
   - "API Key" 필드에 붙여넣기
   - "Save" 클릭

---

## 💳 빌링 확인

### 4. Claude Max 구독 상태 확인

**확인 경로**:
- https://claude.ai/settings/subscription
- 구독 상태: **Claude Max ($220/월)**
- Opus 4.5 한도: **무제한**

### 5. Cursor Ultra On-Demand 설정

**현재 설정**:
- On-Demand 한도: **$50** (이미 설정됨)
- 최근 사용: **$44** (거의 한도 도달)

**권장 설정**:
- On-Demand 한도: **$30** (안전장치)
- 기본 모델: **Sonnet** (가성비)
- Opus 4.5는 Claude Code로만 사용

---

## 🧪 테스트 실행

### 6. Claude Code 첫 테스트

**터미널에서 실행**:
```bash
# Claude Code 명령어 확인
claude-code --help

# 간단한 작업 테스트
claude-code --task "README.md에 오늘 날짜 추가"
```

**또는 Cursor 내에서**:
- `Cmd + Shift + P` → "Claude Code: Analyze Project"
- 프로젝트 분석 실행
- Opus 4.5 사용 여부 확인

### 7. 빌링 확인 방법

**Claude.ai 대시보드**:
- https://console.anthropic.com/usage
- "API Usage" 탭 확인
- Opus 4.5 요청 수 확인

**Cursor 내 확인**:
- Settings → Usage
- "Claude Code" 사용량 확인
- 모델별 사용량 확인

---

## ⚙️ 최적 설정

### 8. Project Rules 설정

**Cursor Settings → Project Rules**:
```
1. 대화 기반 코딩 유지
2. .cursorrules 규칙 준수
3. 세션 로그 자동 기록
4. 민감 정보 생성 금지
5. 작은 단위 수정만 수행
```

### 9. 모델 선택 전략

| 작업 | 모델 | 이유 |
|------|------|------|
| **일반 코딩** | Sonnet (Cursor Ultra) | 빠르고 저렴 |
| **복잡한 작업** | Opus 4.5 (Claude Code) | 깊이 있는 분석 |
| **전략/문서** | Opus 4.5 (웹 Claude Max) | 긴 대화 |

---

## ✅ 체크리스트

### 설정 완료 확인

- [ ] Claude Code 확장 활성화
- [ ] Claude Max API 키 연결
- [ ] Opus 4.5 모델 선택
- [ ] 빌링 연동 확인
- [ ] 첫 테스트 실행
- [ ] 사용량 모니터링 설정

---

## 🚨 문제 해결

### API 키 오류
```
에러: "Invalid API key"
해결: Claude.ai에서 새 API 키 발급 → Cursor에 재입력
```

### Opus 4.5 사용 안 됨
```
문제: Sonnet만 사용됨
해결: Cursor Settings → Models → Opus 4.5 선택
```

### 빌링 미적용
```
문제: Claude Max 구독인데 요금 청구됨
해결: API 키가 Max 계정인지 확인
```

---

**작성: 쌍아 (Claude)**  
**날짜: 2026-01-24**
