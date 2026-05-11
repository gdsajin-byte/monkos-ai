---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-05-11
project: CITADEL Phase 2.2 Tier 1
priority: 높음
portfolio: PF_CITADEL
deadline: W1 (5/12~5/18)
---

# 지시서: CITADEL Phase 2.2 Tier 1 — 전환율 최적화 4건

## 배경

- 민아 제안서 승인 완료 (PROPOSAL_20260511_민아_CITADEL_Phase22)
- 노출 +153%, 클릭 +206%까지 왔으나 **CTR 1.5~2%가 병목**
- Tier 1 = 즉시 실행 가능한 4건. 서로 독립적, 병렬 가능

## 임무 A: specs 타이틀/메타 디스크립션 최적화

**문제**: specs가 노출 1위 엔진이지만 CTR 1.5~2%.

**작업**:
1. `specs-data.json`의 title/description 필드 일괄 갱신
   - title: 연도(2026) + 핵심 키워드 + 정보 열거형 ("사이즈·배경·복장 총정리")
   - description: CTA 포함 ("무료 AI 증명사진 도구로 바로 만들기")
2. 3언어(KO/JA/EN) 동시 적용
3. `render.js`에서 title/meta 반영 확인

**대상 우선**: korea-drivers-license (노출 257), korea-resident (노출 136), korea-passport (여권 8위 진입)

## 임무 B: "AI 증명사진" 전용 랜딩 신설

**문제**: "ai 증명사진" 순위 127위, CTR 67%. 전용 페이지 없음.

**작업**:
1. `/guide/ai-photo` (KR) 신설
2. 콘텐츠: AI 증명사진 원리 + Before/After + 가격 비교(사진관 vs AI) + 바로 시작 CTA
3. JSON-LD: HowTo + FAQ
4. hreflang: KR 먼저. ja/en은 차후 확장
5. sitemap 추가
6. server.js 라우트 추가

**키워드 포함**: "무료 ai 증명사진 사이트", "증명사진 ai", "ai 증명사진 이력서"

## 임무 C: "여권사진 규격 2026" 랜딩 강화

**문제**: "한국 여권 사진 규격 2026" 순위 8위 진입, 클릭 0.

**작업**:
1. /specs/korea-passport 타이틀·메타에 "2026" 연도 명시 + "여권사진" 전면 배치
2. FAQ 확장: "여권사진 집에서 찍어도 되나요?", "여권사진 메이크업 주의사항"
3. 관련 블로그 → specs 양방향 내부 링크
4. A 작업(specs-data.json)에 포함 가능

## 임무 D: 저CTR EN 블로그 noindex 정리

**문제**: /en/blog/claudemax-20x 등 노출 대비 CTR 극저 페이지가 크롤 예산 낭비.

**작업**:
1. GSC 데이터로 EN 블로그 중 **CTR 1% 미만 + 노출 50회 이상** 페이지 목록 추출
2. **대상 목록을 먼저 보고** → 작가님 확인 후 noindex 적용
3. 확인 받은 페이지에 `<meta name="robots" content="noindex">` 추가
4. render-blog.js 또는 server.js에 조건부 noindex 로직

⚠️ **noindex 대상 목록은 반드시 작가님 확인 후 적용. 임의 적용 금지.**

## ⚠️ 준수 조항

- **ch5 배포**: deploy.sh 경유 필수
- **헌법 4조 4항**: 되는 것만 표기. 미확정 수치 과장 금지
- D작업 noindex는 대상 목록 보고 → 승인 → 적용 (3단계)

## 완료 기준

- [ ] A: specs-data.json 타이틀/메타 갱신 (상위 3개국 + 전체)
- [ ] B: /guide/ai-photo 신설 + JSON-LD + sitemap
- [ ] C: korea-passport 강화 (A에 포함 가능)
- [ ] D: noindex 대상 목록 보고 (적용은 승인 후)
- [ ] 배포 완료
- [ ] COMPLETION 보고서 → PF_CITADEL 히스토리 어펜드
