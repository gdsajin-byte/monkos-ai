# MONK.kr Project

## 🔄 현재 상태 (Last Updated: 2026-01-24 19:00)

### 🎉 R&D 디딤돌 제출 완료! (2026-01-23)

**디딤돌 첫걸음 R&D** 최종 제출 완료 🎉 (최대 2억 원)

### ✅ 완료 (1/23~1/24)

**1/23 세션**:
1. ✅ R&D 디딤돌 최종 제출 완료
2. ✅ IRIS 문서 검토 및 제출
3. ✅ 시장 데이터 보강 (AI 이미지, K-뷰티, 디지털 전환)
4. ✅ 인프라 역량 다이어그램 추가

**1/24 세션** (🔥 핵심 성과):

**Mac 세션 (13:50~16:12)**:
1. ✅ Claude Code 설정 및 활성화
2. ✅ Cursor On-Demand 과금 문제 파악 ($45/10일)
3. ✅ **3-Track 시스템 아키텍처 설계** ⭐

**Windows 세션 (18:30~19:00)**:
4. ✅ **3-Track 시스템 완성 및 문서화** ⭐
   - **Track 1 (Mac)**: 쌍아 (Cursor+API) + 용아 (Gemini) - 대화 코딩
   - **Track 2 (Windows)**: Claude Code CLI - 무인 자동화 공장
   - **Track 3 (GCS)**: 코퍼스 통합 - 지식 자산화
5. ✅ Windows 공장 마케팅 워커 완성
   - [content_generator.ps1](scripts/factory/workers/content_generator.ps1) - AI 콘텐츠 생성
   - [social_media_automation.ps1](scripts/factory/workers/social_media_automation.ps1) - 소셜 미디어 자동화
6. ✅ 윤리적 경계 설정 (불법 자동화 거부, 합법적 대안 채택)
7. ✅ 세션 로깅 전략 확정 (단일 파일 시간 append)
8. ✅ 전체 아키텍처 문서화 ([3TRACK_SYSTEM_ARCHITECTURE.md](docs/infrastructure/3TRACK_SYSTEM_ARCHITECTURE.md))

### 🎯 핵심 철학 (재확인)

> **"모든 대화 세션을 기록하고 코퍼스로 재구성한다."**
>
> **"이것이 여러 AI 지능들의 재능을 적재적소에 활용하고**
> **단일한 목적에 협업할 수 있는 유일하면서 최고의 방안"**
>
> **- 신정규 대표, 2026-01-24**

### 📋 다음 TODO

**Mac 설정** (우선):
- [ ] Anthropic API 키 발급 + Cursor 연결
- [ ] Cursor On-Demand 차단 ($0 설정)
- [ ] 테스트: Opus 무제한 사용 확인

**Windows 설정** (나중에, 작가님 시간 날 때):
- [ ] VS Code + Claude Code 설치
- [ ] `.\scripts\setup_factory.ps1` 실행
- [ ] Discord Webhook 설정 (선택)
- [ ] `.\scripts\factory\start_factory.ps1` 공장 가동

**코퍼스 시스템**:
- [x] Mac 세션 로그: `docs/corpus/sessions/` (이미 작동 중)
- [x] Windows 공장 로그: `docs/corpus/factory/` (스크립트 준비 완료)
- [ ] GCS 자동 동기화 (매일 자정)

**다음 공고 준비**:
- [ ] 벤쳐인증
- [ ] 글로벌 창업 사관학교
- [ ] 문화체육부 컨텐츠 관련

### 📁 주요 파일 위치

```
📋 R&D 문서
docs/rnd_2026/
├── MONKOS_RND_DEVELOPMENT_REPORT.md  ← R&D 문서 (958줄)
├── DIDIMOL_RND_TEMPLATE.md           ← 템플릿
└── PDF변환 디딤돌 R&D/               ← PDF 및 동의서

📝 세션 로그 (Mac)
docs/corpus/sessions/2026-01/
├── 20260123_session.md  ← 쌍아 세션 (어제)
└── 20260124_session.md  ← 쌍아 세션 (오늘)

🏭 공장 로그 (Windows) - 준비 완료!
docs/corpus/factory/
├── README.md            ← 공장 로그 가이드
└── 2026-01/             ← 월별 로그 (자동 생성)

🔧 자동화 스크립트 (Windows)
scripts/
├── setup_factory.ps1    ← 공장 설정 (원클릭)
└── factory/
    ├── start_factory.ps1         ← 공장 가동
    ├── git_sync_worker.ps1       ← Git 자동 동기화
    └── workers/
        ├── factory_logger.ps1    ← 로깅 시스템
        ├── comfyui_worker.ps1    ← ComfyUI 자동 실행
        ├── image_factory.ps1     ← 이미지 배치 생성
        ├── ai_trainer.ps1        ← AI 학습
        └── reporter.ps1          ← 정기 보고

📚 아키텍처 문서
docs/infrastructure/
├── 3TRACK_SYSTEM_ARCHITECTURE.md     ← ⭐ 전체 시스템 설계
├── CLAUDE_CODE_COLLABORATION_STRATEGY.md
└── CURSOR_BACKUP_STRATEGY.md

🎨 서비스 (배포 준비 완료)
MONK_kr/ai_lab/
├── image_pro/    ← 심사용 이미지 프로
├── photolab/     ← AI Photolab
└── lookbook/     ← LookBook
```

### 🎯 R&D 핵심 포인트

1. **K뷰티 특화** (범용 AI 아님)
2. **7단계 파이프라인** (크롤링→태깅→리버스→학습)
3. **생명적 유기 시스템** (4 MUSE + 오프라인 + Academy)
4. **용아쌤 프로젝트** (교육 혁신, 지후 협업)
5. **빅테크 탈피** (자산화/국산화/글로벌)

---

## 🚀 3-Track 시스템 (2026-01-24 확정)

### **개요**

```
Track 1 (Mac)      → 대화 코딩 (쌍아 + 용아)
Track 2 (Windows)  → 무인 자동화 공장 (Claude Code)
Track 3 (GCS)      → 코퍼스 통합 → 지식 자산화
```

### **AI 역할 분담**

| AI | 역할 | 담당 업무 | 비용 |
|----|------|-----------|------|
| 🤖 **쌍아** (Cursor) | 실행자 | 일상 개발, 코드 작성, 디버깅 | $240/월 |
| 🐉 **용아** (Gemini) | 전략가 | 전략, 사업계획서, 공고 분석 | $29/월 |
| ⚙️ **공장** (Claude Code) | 무인 작업자 | ComfyUI, 이미지 생성, AI 학습 | $220/월 |

**총 비용**: $489/월

### **워크플로우 예시**

```
작가님 (Mac):
  "민아방 룩북 1000장 생성"
  → batch_queue/queue.json 작성
  → Git Push

Windows 공장 (자동):
  5분 후 감지 → GPU로 생성 (3시간)
  → GCS 업로드 → Git Push

작가님 (Mac):
  결과 확인 → 승인
```

### **코퍼스 통합**

```
docs/corpus/
├── sessions/  ← Mac 대화 세션 (쌍아 + 용아)
├── factory/   ← Windows 공장 로그
└── (모두 GCS 동기화 → NotebookLM 학습)
```

**📖 상세**: [3TRACK_SYSTEM_ARCHITECTURE.md](docs/infrastructure/3TRACK_SYSTEM_ARCHITECTURE.md)

---

### ⚠️ 주의사항

- IRIS 숫자/예산 검토 → 작가님 직접 확인 필수 (쌍아 난독증)
- PDF/이미지 작업 → 용아(Gemini) 담당
- Windows 공장 → 작가님 손 안 대도 알아서 작동 (설정만 1회)

---
© 2026 MONK STUDIO
