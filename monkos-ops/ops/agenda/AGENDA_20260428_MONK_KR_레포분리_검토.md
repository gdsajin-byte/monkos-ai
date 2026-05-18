---
type: AGENDA
date: 2026-04-28
author: iMac/쌍아
status: 대기
priority: P2
---

# MONK_kr 레포 분리 검토

## 배경

- 현재 `monk_project` 단일 레포에 monk.kr(CF Pages) + monkos.ai(Cloud Run) + ops + governance 전부 포함
- monk.kr은 변경 빈도 거의 없음 (정적 CF Pages 사이트)
- monkos 쪽과 코드 공유 없음 (독립 빌드, 독립 배포)
- 레포 규모 지속 증가 → 분리 실익 커지는 추세

## 분리 대상

- `MONK_kr/` 폴더 → 별도 레포 (예: `gdsajin-byte/monk-kr`)
- CF Pages 배포는 새 레포에 직접 연결

## 분리 시 확인 사항

- [ ] MONK_kr 내부에서 상위 경로 참조하는 코드 없는지 확인
- [ ] CF Pages 빌드 설정이 레포 루트 기준인지 폴더 기준인지
- [ ] 헌법/옵스 체계 — monk.kr 전용 CLAUDE.md 필요 여부 (정적 사이트라 불필요 가능성 높음)
- [ ] git history 보존 여부 (`git filter-repo` 또는 신규 레포)
- [ ] 301/도메인 설정 변경 없음 확인

## 리스크

- **낮음**: monk.kr ↔ monkos.ai 코드 의존성 없음
- CF Pages는 git push = 배포이므로 레포 분리가 자연스러운 구조

## 트리거

- 레포 크기가 체감될 때 또는 monk.kr 개편 시점에 착수
- 작가님 판단에 따름

## 연관

- 4/28 작가님-쌍아 대화: "몽크는 거의 건드리지 않으니 분리 리스크 낮음" 합의
- 포털/monkos 분리는 인증·결제 결합도 문제로 보류 (79 리팩토링 교훈)
