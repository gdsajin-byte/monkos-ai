---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내3
status: 대기
priority: 긴급 (D-2, 4/9 대면평가)
target: USB 온디바이스 챗봇 PoC 구현
ref: REPORT_20260407_iMac막내3_온디바이스챗봇_리서치결과.md
pf: PF_CDP
---

# 지시서: 온디바이스 AI 챗봇 — PoC 구현

> **리서치 결과 Go 판정 완료. 즉시 구현 착수.**
> **목표**: USB에 꽂으면 바로 돌아가는 MONKOS AI 챗봇 프로토타입 완성.

---

## 1. 모델 + 엔진 확보

### 1-1. EXAONE 3.5 2.4B Instruct GGUF 다운로드
- HuggingFace에서 `EXAONE-3.5-2.4B-Instruct` Q4_K_M GGUF 파일 확보
- 검색: `EXAONE 3.5 2.4B GGUF` (공식 또는 커뮤니티 양자화본)
- 파일 크기 약 1.64GB
- 저장 경로: `apps/monkos-chat/model/`

### 1-2. llamafile v0.10.0 다운로드
- GitHub `Mozilla-Ocho/llamafile` releases에서 최신 바이너리
- 크로스 플랫폼 바이너리 1개 (~30MB)
- 저장 경로: `apps/monkos-chat/`

---

## 2. 시스템 프롬프트 작성

파일: `apps/monkos-chat/data/system_prompt.txt`

### 구성
```
[역할 선언]
당신은 MONKOS AI 어시스턴트입니다.
몽크사진관(MONK.KR)의 AI 증명사진·뷰티 서비스 전문 상담 챗봇입니다.

[도메인 지식 — 제안서 핵심]
(제안서 핵심 내용 10K 토큰 이내로 정리)
- 기업 개요: 몽크사진관 → MONKOS 플랫폼화
- 핵심 기술: K-뷰티 도메인 특화 자가 진화 파이프라인
- 서비스 6종: 증명사진/크롭/블로그/챗봇/포털/어드민
- R&D 실적: Git 266커밋, 코드 48만줄, Cloud Run 118회 배포
- 팀: 신정규(사진작가 20년) + 한송이(미용교육학 석사, 향장생물학 박사과정)
- 차별점: 29개 경쟁사 중 3단계 풀 파이프라인(코칭→생성→QC) 유일

[반박서 핵심 — 8건 1줄 반론]
① 발색 수치 → 제안서에 '발색' 0회. 오독
② GPU 처리 속도 → GPU는 연구장비(파인튜닝용 VRAM)
③ 전문가 편향 → RLHF는 글로벌 표준 학습 방식
④ 범용 GenAI 차별성 → MCP/CDP 자체 개발 + 멀티에이전트 실가동
⑤ 크롤링 저작권 → 100% 사용자 본인 사진. 저작권 분쟁 구조 부재
⑥ 빅테크 대비 경쟁력 → Adobe·Runway는 증명사진 안 함. 범주 오류
⑦ 고해상도 vs 저비용 → 서로 다른 연구과제를 하나로 합친 오독
⑧ 사업화 전략 미흡 → 6개 서비스 라이브 + 결제·인증·고용 실행 증명

[응답 규칙]
- 한국어로 응답
- 간결하고 전문적인 톤
- 제안서에 없는 내용은 "해당 내용은 제안서 범위 밖입니다"로 응답
- 미출시·미확정 표현 금지. 되는 것만 응답
```

### 소스 참조
- 제안서 원문: 작가님 로컬 또는 기존 반박서 데이터
- 반박서 8건: 슬라이드 S5 반론표 그대로 활용

---

## 3. 실행 스크립트

### start.bat (Windows)
```bat
@echo off
chcp 65001 >nul
echo.
echo  ==========================================
echo   MONKOS AI - On-Device Chatbot Starting...
echo  ==========================================
echo.
echo  모델을 메모리에 적재 중입니다. 잠시 기다려주세요...
echo.
cd /d "%~dp0"
monkos-chat.exe -m model\exaone-3.5-2.4b-q4_k_m.gguf --server --ctx-size 32768 --system-prompt-file data\system_prompt.txt --port 8080 --threads 4
pause
```

### start.sh (Mac 대비)
```bash
#!/bin/bash
echo ""
echo "  =========================================="
echo "   MONKOS AI - On-Device Chatbot Starting..."
echo "  =========================================="
echo ""
echo "  모델을 메모리에 적재 중입니다. 잠시 기다려주세요..."
echo ""
cd "$(dirname "$0")"
chmod +x monkos-chat.exe
./monkos-chat.exe -m model/exaone-3.5-2.4b-q4_k_m.gguf --server --ctx-size 32768 --system-prompt-file data/system_prompt.txt --port 8080 --threads 4
```

---

## 4. 테스트 시나리오

### iMac에서 1차 테스트
```bash
cd apps/monkos-chat
./monkos-chat.exe -m model/exaone-3.5-2.4b-q4_k_m.gguf --server --ctx-size 32768 --system-prompt-file data/system_prompt.txt --port 8080 --threads 4
# 브라우저에서 http://localhost:8080 접속
```

### 필수 검증 항목
| 항목 | 기준 |
|------|------|
| 모델 로딩 | 60초 이내 (iMac 기준) |
| 첫 응답 TTFT | 10초 이내 |
| 한국어 응답 품질 | 제안서 기반 Q&A 3건 이상 자연스러운 응답 |
| 시스템 프롬프트 | 역할/도메인 지식 정상 로드 확인 |
| 메모리 사용량 | 4GB 이하 |

### 테스트 질문 5건
1. "이 과제의 핵심 기술이 뭡니까?"
2. "기존 AI 뷰티 서비스와 차별점은?"
3. "GPU가 왜 필요한 겁니까?"
4. "크롤링 저작권 문제는 없습니까?"
5. "사업화 전략이 구체적으로 뭡니까?"

---

## 5. 산출물

```
apps/monkos-chat/
├── monkos-chat.exe              # llamafile 바이너리
├── model/
│   └── exaone-3.5-2.4b-q4_k_m.gguf
├── data/
│   └── system_prompt.txt
├── start.bat
├── start.sh
└── README.md                    # 실행 방법 + 테스트 결과
```

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키 불필요 (온디바이스). 모델 라이선스 NC 확인 완료 (시연 용도 허용)
- **헌법 4조 3항**: 내부 기밀 보호. 시스템 프롬프트에 에이전트 호칭(쌍아/민아/막내) 절대 미포함. 외부 표기 "MONKOS AI"
- **헌법 4조 4항**: 챗봇 응답은 되는 것만. 미출시·미확정 표현 금지
- **파괴적 명령 금지**: 모델 다운로드와 로컬 테스트만. 프로덕션 영향 없음

---

## 6. 완료 기준

1. EXAONE 3.5 2.4B GGUF + llamafile 확보
2. system_prompt.txt 작성 완료
3. iMac 로컬 테스트 — 질문 5건 응답 품질 확인
4. start.bat / start.sh 동작 확인
5. 완료 보고 (✅❌💡⏳📁🔀 형식)
