# 🎯 Claude Code 주요 기능 가이드

**작성일**: 2026-01-24  
**목적**: Claude Code의 핵심 기능과 작가님 워크스타일 활용법

---

## 📋 Claude Code 주요 기능

### 1. **Claude Code: Chat** (채팅)

**기능**:
- Cursor 내에서 Claude와 직접 대화
- 코드 관련 질문, 디버깅, 설명 요청
- 프로젝트 컨텍스트를 자동으로 읽고 답변

**실행 방법**:
- `Cmd + Shift + P` → "Claude Code: Chat" 입력

**사용 예시**:
```
"이 함수가 왜 에러 나지?"
"Tailwind CSS로 다크 모드 구현해줘"
"이 코드 리팩토링 방법 알려줘"
```

**장점**:
- ✅ Cursor를 떠나지 않고 대화 가능
- ✅ 현재 열린 파일을 자동으로 컨텍스트에 포함
- ✅ Opus 4.5 사용 (Claude Max 구독 시)

---

### 2. **Claude Code: Sessions** (세션)

**기능**:
- 대화 세션을 저장하고 관리
- 이전 대화 내용을 불러와서 이어서 작업
- 여러 프로젝트의 대화를 분리해서 관리

**사용 예시**:
```
세션 1: "AI LAB 프론트엔드 작업"
세션 2: "백엔드 API 개발"
세션 3: "버그 수정"
```

**장점**:
- ✅ 맥락 유지 (작가님 워크스타일과 완벽히 일치!)
- ✅ 프로젝트별로 대화 분리
- ✅ 나중에 다시 참조 가능

---

### 3. **Claude Code: Analyze Project** (프로젝트 분석)

**기능**:
- 전체 프로젝트 구조 분석
- 코드베이스 이해 및 요약
- 개선 제안

**실행 방법**:
- `Cmd + Shift + P` → "Claude Code: Analyze Project"

**사용 예시**:
```
"이 프로젝트의 구조를 분석해줘"
"어떤 기술 스택을 사용하고 있어?"
"보안 취약점 있어?"
```

---

### 4. **Claude Code: Generate** (자동 생성)

**기능**:
- 코드 자동 생성
- 파일 전체 분석 후 수정
- 테스트 코드 자동 생성

**사용 예시**:
```
"README.md 생성해줘"
"이 함수에 대한 테스트 코드 작성해줘"
"API 문서 자동 생성"
```

---

## 💡 작가님 워크스타일과의 궁합

### Chat + Sessions = 완벽한 조합

**작가님 워크스타일**:
- ✅ 대화와 맥락을 통해 코딩 컨트롤
- ✅ 점진적 아이디어 발전
- ✅ 세션 로그로 맥락 유지

**Claude Code의 강점**:
- ✅ Chat으로 대화 기반 코딩
- ✅ Sessions으로 맥락 유지
- ✅ Opus 4.5로 깊이 있는 분석
- ✅ 프로젝트 컨텍스트 자동 로드

---

## 🚀 실전 사용법

### 시나리오 1: 새 기능 개발

```
1. Cmd + Shift + P → "Claude Code: Chat"
2. "AI LAB에 이미지 업로드 기능 추가하고 싶어"
3. Claude Code가 파일 분석 후 제안
4. 대화하면서 점진적 개발
5. Sessions으로 저장 → 나중에 이어서 작업
```

### 시나리오 2: 디버깅

```
1. 에러 발생한 파일 열기
2. Claude Code: Chat 실행
3. "이 에러 왜 나지?"
4. Claude가 파일 분석 후 원인 설명
5. 해결 방법 제시
```

### 시나리오 3: 대규모 리팩토링

```
1. Claude Code: Analyze Project
2. "전체 프로젝트 구조 분석해줘"
3. 개선 제안 받기
4. 세션 저장
5. 나중에 세션 불러와서 이어서 작업
```

---

## 🔄 Cursor AI vs Claude Code

| 기능 | Cursor AI (쌍아) | Claude Code |
|------|------------------|-------------|
| **대화** | Composer 채팅 | Claude Code: Chat |
| **파일 편집** | 직접 편집 | 제안 후 적용 |
| **맥락 유지** | Composer 세션 | Sessions |
| **모델** | Sonnet (기본) | Opus 4.5 (Max) |
| **비용** | Cursor Ultra | Claude Max |

---

## 💰 비용 최적화 전략

### Cursor AI (쌍아) 사용

- 일반 코딩, 빠른 수정
- Sonnet 모델 (저렴)
- On-Demand 절약

### Claude Code 사용

- 복잡한 분석, 대규모 리팩토링
- Opus 4.5 모델 (Max 구독)
- 깊이 있는 작업

---

## 📌 빠른 명령어 정리

| 명령어 | 단축키 | 용도 |
|--------|--------|------|
| **Claude Code: Chat** | `Cmd+Shift+P` → Chat | 대화 시작 |
| **Claude Code: New Session** | - | 새 세션 시작 |
| **Claude Code: Analyze Project** | - | 프로젝트 분석 |
| **Claude Code: Generate** | - | 코드 생성 |

---

**작성: 쌍아 (Claude)**  
**작가님 워크스타일에 최적화된 Claude Code 활용 가이드**
