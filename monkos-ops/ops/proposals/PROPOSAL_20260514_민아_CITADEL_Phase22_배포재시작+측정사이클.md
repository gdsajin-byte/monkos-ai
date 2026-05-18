---
type: proposal
date: 2026-05-14
from: iMac/민아
to: 작가님, iMac/쌍아
subject: PF_CITADEL Phase 2.2 — 배포 재시작 + 측정 사이클 + Tier 2 우선순위 (5/14 후속)
portfolio: PF_CITADEL
status: 작가님 리뷰 → 쌍아 ORDER 환급 대기
prior: PROPOSAL_20260511_민아_CITADEL_Phase22_전환율최적화+키워드확장.md
---

# CITADEL Phase 2.2 — 배포 재시작 + 측정 사이클 + Tier 2 우선순위

**[2026-05-14 12:00 KST] iMac/민아 → 작가님, iMac/쌍아**

---

## 0. 배경 — 일주일째 잠긴 자산

5/11 19:04 KST 커밋 `e315cad6`로 **Tier 1 코드 4건(A/B/C/D) 완료**.
이후 5/12~5/14 작가님 라인 우선순위가 MonkosCrop iOS·ch4 10조·디바이스 통일·VSCode 조사로 전환 → **monkos-portal prod 배포 0건**.

결과:
- "여권사진" 8위 진입 페이지가 **신규 seoTitle 미반영 상태로 노출 누적**
- "AI 증명사진" CTR 67% 키워드 매칭 페이지(`/guide/ai-photo`)가 **검색엔진에 존재하지 않음**
- 5/11 이후 GSC 신규 측정 부재 → **다음 의사결정 데이터 공백**

→ 본 제안서의 핵심은 "**새 작업 추가**"가 아니라 "**잠긴 자산 라이브화 + 측정 사이클 정착 + Tier 2 진입 트리거 명확화**".

---

## 1. 즉시 환급 단위 (쌍아 ORDER 분해용)

### Unit-1. monkos-portal Tier 1 prod 배포

**규모**: 단일 명령 (`monkos_AI/portal/deploy.sh` 경유), 5분 내 완료
**산출물**: portal Cloud Run 신규 rev. 5개 URL 200 OK 검증 (curl)
**검증 항목**:
- `/specs/korea-passport`·`/specs/korea-drivers-license`·`/specs/korea-resident` 신규 title/description HTML 노출
- `/guide/ai-photo` 200 OK + HowTo/FAQ JSON-LD 응답
- `/en/blog/claudemax-20x*` `<meta name="robots" content="noindex">` 응답
- sitemap.xml 신규 URL `/guide/ai-photo` 포함

**선행 의존**: 없음 (`e315cad6` 이미 main 머지 완료)
**막내 부담**: ⭐ 단일 막내 5분

> ⚠️ 헌법 5장 2조 — gcloud 직접 배포 금지. deploy.sh 경유 필수.

---

### Unit-2. 배포 후 GSC 색인 재요청 + 즉시 검증

**규모**: GSC URL 검사 5건 + 색인 요청
**산출물**: GSC 콘솔 캡처 5건, 검사 결과 (Indexed / Discovered / Crawled)
**대상**:
- `/guide/ai-photo` (신규 URL — 최우선 색인 필요)
- `/specs/korea-passport`·`/specs/korea-drivers-license`·`/specs/korea-resident` (재크롤 트리거)
- `/sitemap.xml` 재제출

**선행 의존**: Unit-1 배포 완료
**막내 부담**: ⭐ 민아 단독 (GSC 접근 권한 보유)

---

### Unit-3. 7일 GSC 측정 사이클 (W+1)

**규모**: 단발 측정 보고서 1건
**산출물**: `REPORT_20260521_민아_CITADEL_Phase22_Tier1_7일효과측정.md`
**측정 지표**:

| 지표 | 5/11 기준점 | W+1 목표 (5/21) | 판정 기준 |
|------|------------|----------------|----------|
| `/guide/ai-photo` 인덱싱 | 미존재 | Indexed | ⭐ 가장 빠른 시그널 |
| "ai 증명사진" 순위 | 127위 | 100위 이내 | 30위 이내가 Tier 2 트리거 |
| "여권사진" 계열 순위 | 8위 | 5위 이내 | seoTitle 효과 |
| specs CTR (3건 평균) | 1.7% | 2.5%+ | seoTitle 직접 효과 |
| 일 노출 평균 | 85 | 100+ | 보수적 목표 |

**의사결정 분기**:
- 전 지표 목표 도달 → **Tier 2 즉시 진입** (Unit-4~6 ORDER 발행)
- 부분 도달 → **Tier 1 보강 우선** (Tier 1-Plus: 추가 specs·추가 noindex)
- 전무 → **근본 원인 재조사** (배포 누락·robots.txt·캐시 등 인프라 점검)

**선행 의존**: Unit-1 배포 후 7일 경과
**막내 부담**: 민아 + 막내1 (GSC API 데이터 수집)

---

### Unit-4. Tier 2-E — 엔티티 SEO Organization 스키마 (Person 보류)

**규모**: home.js JSON-LD 추가 + 배포 1건
**산출물**: Organization 스키마 라이브 + 구글 Rich Results Test 검증 통과
**구성**:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MONKOS",
  "url": "https://monkos.ai",
  "logo": "https://monkos.ai/og-image.png",
  "founder": "(작가님 결정: Person 스키마 동반 여부)",
  "sameAs": [
    "https://note.com/monkos",
    "https://www.instagram.com/monkos.ai",
    "(추가 SNS — 작가님 확정)"
  ]
}
```

**작가님 결정 필요**:
- Person 스키마 동반 여부 (실명 노출 의향)
- sameAs 배열 외부 프로필 확정 (네이버 플레이스·인스타·note.com·GitHub 등)

**선행 의존**: Unit-3 측정 결과 (Tier 2 진입 트리거)
**막내 부담**: ⭐ 단일 막내 15분

---

### Unit-5. Tier 2-F — 외부 백링크 5건 (DA 0 탈출)

**규모**: 채널별 액션 5개 (담당 분산)
**산출물**: 8주 내 백링크 5건 확보 + ahrefs/구글 인덱스 확인

| 채널 | 담당 | 액션 | ORDER 분리 |
|------|------|------|-----------|
| note.com | 한송이 | 일본어 콘텐츠 + monkos.ai 링크 | works/han 채널 지시 |
| 네이버 블로그 | 꾸(와이프) | KR 콘텐츠 + monkos.ai 링크 | works/kku 채널 지시 |
| GitHub | 코웍이 또는 막내 | llms.txt 오픈소스 + README 링크 | 별도 ORDER |
| 네이버 플레이스 | 작가님 | monk.kr 플레이스에 monkos.ai 링크 추가 | 작가님 직접 |
| monkos.ai /about | 막내 | 외부 프로필 sameAs 링크 (Unit-4와 통합 가능) | Unit-4 흡수 |

**작가님 결정 필요**:
- 한송이·꾸 채널 콘텐츠 주제 (벌써 정해진 라인이 있으면 그쪽 우선)
- GitHub llms.txt 공개 시점 (현재는 monkos.ai 도메인 내부만 노출)

**선행 의존**: Unit-3 측정 결과 + 채널별 콘텐츠 준비
**막내 부담**: 분산. 막내는 GitHub + Unit-4 통합 작업만

---

### Unit-6. Tier 2-G — 일본 L1 랜딩 2건 (証明写真 背景 + スーツ合成)

**규모**: server.js 라우트 + HTML 2건 + sitemap 추가. 배포 1건
**산출물**: idphoto-jp Cloud Run 신규 rev. 2개 URL 200 OK + JSON-LD 검증
**대상**:
- `/guide/background` (証明写真 背景 — 배경색 가이드, 현재 3노출)
- `/guide/suit-composite` (スーツ合成 — 정장 합성 AI, 현재 2노출+2클릭)

**패턴**: Phase 2.1 L1 5건 그대로 (title·meta·H1·hreflang·JSON-LD·CTA `/prep`)
**선행 의존**: Unit-3 측정 결과 (Tier 2 진입 트리거)
**막내 부담**: ⭐⭐ 단일 막내 30분 (Phase 2.1 검증된 패턴 재사용)

---

## 2. Tier 1 보강 백업안 (Unit-3 결과 분기용)

Unit-3에서 Tier 1 효과가 약한 경우 진입:

### Unit-3-Plus-A. specs 확장 (3→상위 8건)

- 현재 A는 3건만 적용. 노출 상위 후속 5건 확장
- 대상 후보: `/specs/japan-passport`·`/specs/usa-passport`·`/specs/china-passport`·기타 EN 트래픽 발생 specs

### Unit-3-Plus-B. claudemax 외 EN noindex 일괄

- 5/11 Proposal §6 결정 #2: CTR 1% 미만 EN 전체 noindex 권장 → 보류 상태
- `NOINDEX_SLUGS` Set 패턴 이미 적용됨. 후보 slug 추출 + 일괄 등록만 하면 됨
- 막내 1명 30분

### Unit-3-Plus-C. internal linking 확장

- 블로그 ↔ specs 양방향 링크 (현재 단방향)
- specs ↔ guide 연결 강화

---

## 3. Tier 3 (시스템 자동화) 진입 조건

5/11 Proposal §3에서 제안한 Tier 3 (H 일일 자동 보고서·I AEO 모니터링·J crop 다국어 분리)는 **Unit-3 측정 사이클이 한 번 이상 작동한 이후** 진입.

→ 현재 시점 ORDER 환급 대상에서 제외.

---

## 4. 측정·보고 사이클 정착 (반복 운용 제안)

| 주기 | 작업 | 담당 | 산출물 |
|------|------|------|--------|
| 배포 직후 | 5개 URL 검증 + GSC 색인 요청 | 막내1 또는 민아 | curl 결과 + GSC 캡처 |
| 배포 후 7일 | GSC 효과 측정 + 의사결정 분기 | 민아 | REPORT 1건 |
| 매주 월요일 09:00 KST | GSC 28일 추세 + 이상치 점검 | 민아 (수동) → 향후 Tier 3-H 자동화 | REPORT 1건 |
| Tier 2 진입 후 | 8주 후 종합 평가 | 민아 | Phase 2.2 결산 REPORT |

> 사이클 정착 = 시타델이 다른 PF에 우선순위가 밀리더라도 **자동 알림+측정**으로 자산 사장 방지.

---

## 5. 작가님 결정 필요 사항 (쌍아 환급 시 옵션 명시)

| # | 항목 | 잠정 권장 | 결정 권자 |
|---|------|----------|----------|
| 1 | Unit-1 (Tier 1 배포) 즉시 실행 여부 | **즉시 실행** | 작가님 |
| 2 | Unit-4 Person 스키마 동반 여부 | Organization 먼저, Person 추후 | 작가님 |
| 3 | Unit-4 sameAs 외부 프로필 확정 | 네이버 플레이스 + note.com + 인스타 3건 최소 | 작가님 |
| 4 | Unit-5 한송이/꾸 채널 콘텐츠 주제 | 한송이 = 취활 사진 가이드, 꾸 = 네이버 블로그 일상 사진 팁 | 작가님 |
| 5 | Unit-3-Plus-B 진입 자동성 | Unit-3 결과 부분 도달 시 자동 진입 (별도 결재 불요) | 쌍아 위임 가능 |

---

## 6. 우선순위 한눈에

```
[Day 0 — 오늘]
  Unit-1 portal 배포 ← 🔴 막내1 5분, 단일 명령
  Unit-2 GSC 색인 요청 ← 민아, 배포 후 즉시
  
[Day 1~7]
  (대기 — 색인 반영 시간)
  
[Day 7 — 5/21]
  Unit-3 7일 효과 측정 → 분기 결정
    ├─ 전 지표 도달 → Unit-4·5·6 일괄 환급
    ├─ 부분 도달 → Unit-3-Plus 환급
    └─ 전무 → 인프라 재진단
  
[Day 7+]
  Tier 2 진입 또는 Tier 1 보강 분기 실행
  
[Week 4~8]
  Tier 2 완료 → Tier 3 (자동화) 진입 검토
```

---

## 7. 요약

**한 줄**: 5/11 Tier 1 코드를 이번 주 안에 라이브화하고, 7일 GSC 측정 사이클을 정착시켜 Tier 2 진입 트리거를 명확히 한다.

**핵심 전환**: "Phase 2.2를 한 번에 끝낸다"에서 **"배포→측정→분기→다음 단위"의 반복 루프 정착**으로.

**쌍아 환급 형태**: Unit-1·2를 우선 단일 ORDER로, Unit-3은 W+1 시점 별도 ORDER, Unit-4·5·6은 Unit-3 결과 분기 후 환급.

---

*[2026-05-14 12:00 KST] iMac/민아 작성. 쌍아 ORDER 환급 대기.*
