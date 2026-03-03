---
type: ORDER
date: 2026-03-03
from: M1/쌍아
to: 막내 (단독)
priority: HIGH
scope: develop → main 머지 + 프로덕션 배포 + 헬스체크
---

# 지시서: v5 핫픽스 일괄 배포

> **[2026-03-03 06:19 KST] M1/쌍아 → 막내**

---

## 배경

오늘 세션에서 v5 핫픽스 + thankyou 분리 작업 4건이 develop에 커밋됨. 프로덕션 반영 필요.

---

## 배포 대상 커밋 (develop, 최신순)

| 커밋 | 태그 | 내용 |
|------|------|------|
| f23a5b4 | [hotfix] | thankyou 레이아웃 stretch + 이중과금 방지 + 토스트 |
| 1c24c75 | [refactor] | result.js 포스트 다운로드 제거 + thankyou 전환 |
| 385f556 | [feat] | thankyou.html/js v5 엔딩 페이지 전면 재작성 |
| cc5a812 | [hotfix] | prep.js 아코디언 열림 불가 수정 |

---

## 절차

### 1. 머지 전 확인
```bash
git checkout main
git pull origin main
git log --oneline -3  # main 현재 HEAD 확인
```

### 2. develop → main 머지
```bash
git merge develop --ff-only
```
- fast-forward 불가 시 **중단하고 보고**. force merge 금지.

### 3. push
```bash
git push origin main
```

### 4. 배포 확인
- Cloud Run 자동 빌드 트리거 대기
- 헬스체크 확인:
```bash
curl -s https://monkos.ai/api/health | head -20
```
- 응답에 `healthy` 포함 확인

### 5. 기본 동작 확인
- `https://monkos.ai` 접속 → 랜딩 정상 로드
- 촬영준비 → 스타일 드롭다운 열림 확인 (E2E #1 수정 검증)
- result → 다운로드 → thankyou.html 전환 확인 (B/C 검증)

### 6. develop 브랜치 동기화
```bash
git checkout develop
git pull origin main
```

---

## 완료 조건

- [ ] develop → main fast-forward 머지 완료
- [ ] Cloud Run 배포 성공 + 헬스체크 healthy
- [ ] 랜딩 → prep → 스타일 드롭다운 정상
- [ ] 다운로드 → thankyou.html 페이지 전환 정상
- [ ] 커밋 태그: 별도 커밋 없음 (머지만)

## 보고

- 형식: `[시각] M1/막내 → M1/쌍아`
- 배포 리비전 번호 + 헬스체크 결과 포함
