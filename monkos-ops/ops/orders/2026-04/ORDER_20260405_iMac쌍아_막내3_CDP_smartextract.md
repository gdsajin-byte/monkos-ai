---
type: order
from: iMac/쌍아
to: iMac/막내3
date: 2026-04-05
subject: CDP smart_extract() — 텍스트 구조화 추출
status: 대기
portfolio: PF_CDP
priority: important
pf: PF_CDP
---

[2026-04-05 17:00 KST] iMac/쌍아 → iMac/막내3

# smart_extract() — 텍스트 구조화 추출

## 문제

cdp.text()는 평문만 반환. 공고 상세의 key-value 테이블, 제목/본문 구분, 첨부파일 링크 등이 구조 없이 섞임.

## 해결

```python
async def smart_extract(self) -> dict:
    """페이지 콘텐츠를 구조화 추출"""
    # JS로 DOM 구조 분석:
    # 1. title: document.title 또는 h1
    # 2. headings: h1~h6 목록
    # 3. tables: <table>을 [{key: value}] 형태로 파싱
    # 4. body: 메인 콘텐츠 영역 텍스트 (nav/footer/sidebar 제외)
    # 5. links: 첨부파일 링크 (href에 download, .pdf, .hwp, .xlsx 등)
    # 6. images: 주요 이미지 src + alt
    # 7. meta: description, og:title 등
```

반환 구조:
```json
{
    "title": "SaaS 개발 지원사업 공고",
    "headings": ["사업 개요", "지원 대상", "신청 방법"],
    "tables": [
        {"사업명": "SaaS 개발", "접수기간": "4/1~4/22", "지원금": "최대 1억"}
    ],
    "body": "본문 텍스트...",
    "files": [
        {"name": "공고문.pdf", "url": "https://..."}
    ],
    "images": [...],
    "meta": {"description": "..."}
}
```

## 테스트

- 기업마당 공고 상세 — 테이블 파싱 + 첨부파일 추출
- monkos.ai 블로그 글 — 제목/본문/이미지 분리
- GSC 실적 — 데이터 테이블 구조화

## 산출물

- `scripts/tools/cdp_utils.py` — PageProfiler에 smart_extract 추가

## ⚠️ 준수

- 기존 API 수정 금지
- 데이터 변경 금지 (읽기 전용)
