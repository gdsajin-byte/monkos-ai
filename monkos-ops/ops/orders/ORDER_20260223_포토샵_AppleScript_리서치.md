# 막내 지시서 — Photoshop + Claude(소넷이) AppleScript 연동 리서치

**발행**: 2026-02-23 19:16 KST
**발행자**: 쌍아 ← 작가님 직접 지시
**수신**: 막내
**보고 대상**: 작가님 (컨트롤타워)
**긴급도**: 낮음 (리서치)
**기한**: 2026-02-23 19:45 KST (퇴근 전 완료)

---

## ⚠️ 준수 조항
- **헌법 제6조** (인프라 보호): 플러그인 설치/계정 생성 절대 금지. 읽기 전용 조사만
- **헌법 제11조** (윤리적 운용): 미확인 기능을 "가능"으로 표기 금지

---

## 배경

작가님이 Photoshop 작업 시 소넷이(Claude Sonnet)를 붙여서 액션/기능 보조를 시킬 수 있는지 검토 요청. macOS 환경에서 AppleScript를 통한 Photoshop 제어가 유력 경로.

---

## 조사 항목

### A. AppleScript → Photoshop 제어
1. Photoshop AppleScript 지원 현황 (버전별)
2. 제어 가능 범위: 레이어, 필터, 액션 실행, 파일 열기/저장, 배치 처리
3. `tell application "Adobe Photoshop"` 기본 문법 + 실용 예시 5개 이상
4. ExtendScript(JSX) vs AppleScript 차이점
5. macOS Sonoma/Ventura 호환성

### B. Claude Code → Photoshop 파이프라인
1. `osascript` 명령으로 Photoshop 제어 실현 가능성
2. Claude Code(소넷이)가 osascript 실행 → Photoshop 조작 흐름 설계
3. 입력: 자연어 명령 ("이 레이어 리사이즈해") → 출력: AppleScript 생성+실행
4. 제약사항: 보안 권한(TCC), 접근성 허용 필요 여부

### C. 대안 경로 (비교)
1. UXP 플러그인 (Photoshop 내장 JS) + HTTP → Claude API
2. Photoshop Actions 녹화 + AppleScript 트리거
3. Adobe CEP/ExtendScript 레거시 방식
4. 각 방식의 장단점 비교표

### D. 실전 유스케이스 (MONKOS 맥락)
1. 증명사진 배치 리사이즈/크롭
2. 배경 레이어 교체 자동화
3. 광고 이미지 일괄 포맷 변환
4. 결제경로 캡처 후 자동 PPT 배치 (토스 심사용)

---

## 산출물

| 순번 | 산출물 | 경로 |
|------|--------|------|
| ① | Photoshop AppleScript 연동 리서치 보고서 | `docs/rnd_2026/photoshop_applescript_리서치.md` |

---

## 완료 후 자동 처리

리서치 완료 시 세션 로그 작성 후 **자동 커밋+푸시** 진행:
```bash
git add docs/rnd_2026/photoshop_applescript_리서치.md
git add [세션 로그 파일]
git commit -m "[리서치] Photoshop AppleScript 연동 조사"
git push origin develop
```

---

## 완료 조건

- [ ] 조사 항목 A~D 커버
- [ ] AppleScript 실용 예시 5개 이상 포함
- [ ] 산출물 1건 작성
- [ ] 세션 로그 + 커밋 + 푸시 완료
