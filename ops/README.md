# works/ops — 코웍이 운용 인터페이스

> M1/코웍이가 직접 읽고 쓰는 작업 폴더
> monkos-ops 직접 마운트 불가(홈 외부) → 여기서 운용 후 쌍아/막내가 monkos-ops로 동기화

## 구조

```
ops/
├── reports/    코웍이 보고서 (REPORT_YYYYMMDD_코웍이_주제.md)
├── sessions/   세션 로그 (YYYY-MM-DD_코웍이_세션로그.md)
└── orders/     지시서 초안 (ORDER_YYYYMMDD_코웍이→쌍아_주제.md)
```

## 동기화 규칙

코웍이 산출물 → `Desktop/works/ops/` 저장
쌍아/막내 → `monkos-ops/ops/cowork/` 로 주기적 동기화 (rsync)

## 세션 시작 루틴

1. `ops/sessions/` 최신 로그 읽기
2. 해당 프로젝트 `CONTEXT_*.md` 읽기
3. 작업 이어가기
