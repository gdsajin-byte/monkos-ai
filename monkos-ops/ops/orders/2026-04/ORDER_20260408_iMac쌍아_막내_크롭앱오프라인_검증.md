---
type: order
id: ORDER_20260408_iMac쌍아_막내_크롭앱오프라인_검증
date: 2026-04-08
from: iMac/쌍아
to: iMac/막내
status: 대기
priority: 긴급 (D-1)
---

# 지시서 — 크롭앱 오프라인 번들 검증

> **[2026-04-08 14:14 KST]** iMac/쌍아 → iMac/막내

## 목적

디딤돌 대면평가 (4/9) USB 시연용 크롭앱 오프라인 번들의 **실동작 검증**.
쌍아가 직접 제작한 번들을 막내가 독립 검증한다.

## 대상

```
~/Desktop/쌍아/crop-offline/
```

## 검증 항목

### 1. 오프라인 서버 기동 (필수)
```bash
cd ~/Desktop/쌍아/crop-offline
python3 -m http.server 8888
```
- [ ] `http://localhost:8888` 접속 → 페이지 정상 렌더링

### 2. FaceMesh 로딩 확인 (필수)
- [ ] 브라우저 콘솔에서 `typeof FaceMesh` → `"function"`
- [ ] 콘솔에서 `faceMeshReady` → `true`
- [ ] `[FaceMesh] 초기화 완료` 로그 확인
- [ ] CDN 요청 0건 (Network 탭 확인 — 외부 도메인 호출 없어야 함)

### 3. 실사진 테스트 (필수)
- [ ] 정면 얼굴 사진 업로드 → 478포인트 자동 감지
- [ ] 정수리/턱끝/동공 핀 자동 배치
- [ ] ICAO 수치 표시 (상단/얼굴/하단/눈위치 mm)
- [ ] 다운로드 → 크롭 이미지 정상 출력 (413x531px, 300dpi)

### 4. 규격 전환 테스트
- [ ] 여권/신분증 탭 → 반명함 탭 전환 시 수치 재계산
- [ ] 핀 드래그 → 수치 실시간 갱신

### 5. start.command 더블클릭 테스트
- [ ] Finder에서 `start.command` 더블클릭 → 터미널 열림 + 브라우저 자동 오픈
- [ ] 종료: 터미널 창 닫기 → 서버 종료 확인

## ⚠️ 준수 조항

- 헌법 4조 1항: 번들 내 API 키/토큰 없음 확인
- 헌법 4조 2항: 원본 `monkos_AI/portal/public/crop/` 파일 수정 금지 (오프라인 번들은 Desktop/쌍아/ 별도본)
- 원본 crop.js의 CDN 경로는 **그대로 유지** — 프로덕션(monkos.ai/crop)은 CDN 사용이 정상

## 보고

- 5항목 전체 통과 → ✅ 완료 보고
- 실패 항목 있으면 → ❌ 실패 항목 + 콘솔 에러 첨부
- 보고 후 서버 프로세스 정리 (포트 8888 해제)

## 참조

- 사후 오더: `ORDER_20260408_작가님_iMac쌍아_크롭앱오프라인번들.md`
- 크롭앱 원본: `monkos_AI/portal/public/crop/`
- 크롭앱 기술블로그: `Desktop/쌍아/SPEC_20260318_크롭앱개발기_기술블로그용.md`
