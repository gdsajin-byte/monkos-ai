# MONK.KR 마케팅 자동화

## 개요

마케팅/컨텐츠 자동화 인프라. 전략 문서는 `monkos-ops/`로 이전 완료.

## 폴더 구조

```
marketing/
├── n8n/              # n8n 워크플로우 설정
│   ├── docker-compose.yml
│   └── workflows/    # 워크플로우 백업 (JSON)
└── README.md
```

## 이전 완료 문서

| 기존 경로 | 이전 위치 |
|-----------|----------|
| `docs/CHANNEL_STRATEGY.md` | `monkos-ops/05_공유/han/reference/channel_strategy.md` |
| `docs/CONTENT_STRATEGY.md` | `monkos-ops/05_공유/han/reference/content_strategy.md` |
| `docs/MARKETING_INFRA_SPEC.md` | `monkos-ops/03_개발/specs/infrastructure/marketing_infra.md` |

## 핵심 도구

| 도구 | 용도 | 비용 |
|------|------|------|
| **n8n** | 워크플로우 자동화 | 무료 (셀프호스트) |
| **Gemini 2.0** | 컨텐츠 생성 | ~5,000원/월 |
| **Buffer** | 백업 스케줄러 | 무료 (3채널) |

## 시작하기

1. n8n 설치: `cd n8n && docker-compose up -d`
2. 접속: http://localhost:5678 (또는 Tailscale IP)
3. 워크플로우 임포트: `n8n/workflows/` 참조

---

*마지막 업데이트: 2026-02-22*
