---
type: ORDER
id: ORDER_20260315_iMac쌍아_막내_챗봇바UI+배포
date: 2026-03-15
from: iMac/쌍아
to: 막내
priority: P2
status: 대기
---

# 챗봇 바 UI 개선 + 포털 배포

## 목표

1. 챗봇 바 데스크톱 폭 제한 (사이드바 침범 방지)
2. 챗봇 아바타 MONKOS 아이콘으로 교체
3. 모바일 키보드 열림 시 챗봇 바 고정 (스크롤 추종 방지)
4. 포털 프로덕션 배포

## Task

### Task 1: 코드 확인 (쌍아 수정 완료)

아래 3파일이 이미 수정되어 있음. 변경 내용 확인만 할 것:

**portal.css** — `.chatbot-bar`
- `position: fixed; bottom: 0; left: 50%; transform: translateX(-50%)`
- `max-width: 640px` + `border-radius: 16px 16px 0 0`
- `padding-bottom: max(10px, env(safe-area-inset-bottom))` (iOS safe area)
- `.cb-avatar`: 그라데이션 배경 제거 → `<img>` 대응

**index.html** — `.cb-avatar`
- `<div class="cb-avatar">M</div>` → `<div class="cb-avatar"><img src="/monkos-icon.svg" alt="MONKOS"></div>`

**main.js** — `visualViewport` 키보드 대응
- `visualViewport.resize/scroll` 이벤트로 `.chatbot-bar`의 `bottom` 동적 조정

### Task 2: 커밋

```
[ui] 챗봇 바 폭 제한 + 아이콘 교체 + 모바일 키보드 고정
```

### Task 3: 포털 프로덕션 배포

```bash
cd monkos_AI/portal && bash deploy.sh prod
```

배포 후 검증:
- [ ] 데스크톱: 챗봇 바가 메인 콘텐츠 폭(640px)에 맞춰 중앙 정렬
- [ ] 데스크톱: 사이드바 영역 침범 없음
- [ ] 모바일: 입력창 탭 → 키보드 올라옴 → 챗봇 바 키보드 위에 고정
- [ ] 모바일: 키보드 열린 상태에서 메인 스크롤 시 챗봇 바 위치 유지
- [ ] 챗봇 아바타: MONKOS SVG 아이콘 표시

## ⚠️ 준수 조항

- deploy.sh `.env` 경로 주의
- `--to-latest` 플래그 사용 금지
