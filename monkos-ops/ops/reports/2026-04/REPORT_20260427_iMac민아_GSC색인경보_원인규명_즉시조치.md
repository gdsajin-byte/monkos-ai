---
type: report
date: 2026-04-27
author: iMac/민아
subject: GSC 색인 경보 메일 분석 — robots.txt × sitemap 충돌 발견 (즉시 조치 가능)
period: 2026-03-09 ~ 2026-04-27 (Gmail GSC 알림 17건 추적)
data_source: Gmail MCP (sc-noreply@google.com) + curl robots.txt/sitemap.xml 3종
---

# GSC 색인 경보 분석 — robots.txt × sitemap 충돌

**[2026-04-27 17:30 KST] iMac/민아 → 작가님**

> 작가님 지시: "구글 메일에 색인관련 메일이 계속 오고 있어 분석"

---

## 0. 결론 한 줄

**오늘(4/27) 4건의 "robots.txt에 의해 차단됨" 알림 = idphoto-jp/kr 사이트맵에 robots.txt 차단 경로(`/app`, `/camera`, `/prep`)가 그대로 포함되어 있음**. monkos.ai 알림 2건은 추가 조사 필요. 즉시 수정 가능.

---

## 1. 메일 시계열 (60일, 17건)

| 날짜 | 도메인 | 사유 |
|------|--------|------|
| **4/27 08:23** | idphoto-jp 페이지 | **robots.txt에 의해 차단됨** ⭐ |
| **4/27 08:23** | idphoto-jp 사이트맵 | **robots.txt에 의해 차단됨** ⭐ |
| **4/27 08:21** | monkos.ai 사이트맵 | **robots.txt에 의해 차단됨** ⭐ |
| **4/27 08:21** | monkos.ai 페이지 | **robots.txt에 의해 차단됨** ⭐ |
| 4/26 06:48 | monkos.ai | 동영상 구조화 데이터 (uploadDate 시간대 누락) |
| 4/22 06:50 | monkos.ai | FAQPage `mainEntity` 누락 |
| 4/20 04:04 | monkos.ai | 적절한 표준 태그가 포함된 대체 페이지 (정상 신호) |
| 4/14 08:31 | monkos.ai | **트래픽 모니터링 시작** (4/12부터 노출 수집) ⭐ 변곡점 |
| 4/8 11:55~58 (4건) | monkos.ai + idphoto-jp | NOINDEX 태그 제외 |
| 3/24 | monkos.ai | FAQPage `FAQPage` 입력란 중복 |
| 3/23 | monkos.ai | **클릭 10회 달성 축하 메일** |
| 3/19 | idphoto-jp | 트래픽 모니터링 시작 (3/15) |
| 3/19 | monkos.ai | FAQPage mainEntity 누락 |
| 3/16 | monkos.ai | 404 일부 미해결 + 리디렉션 페이지 |
| 3/16 | idphoto-kr | 트래픽 모니터링 시작 (3/14) |
| 3/12 | idphoto-jp/kr | Search Console 사용 시작 |
| 3/9~11 | monkos.ai | 404 새로 감지 + 검증 시작 |

**패턴**: 3/12 GSC 등록 → 3/14~15 첫 노출 수집 → 4/12 monkos.ai 노출 본격 → **4/27 robots.txt 차단 4건 동시 알림**

---

## 2. 결정적 진단 — robots.txt × sitemap 직접 비교

### 2-1. idphoto-jp.monkos.ai (오늘 알림의 핵심)

**robots.txt**:
```
Disallow: /api/
Disallow: /app
Disallow: /prep
Disallow: /camera
Disallow: /result
Disallow: /thankyou
```

**sitemap.xml에 들어있는 URL**:
```
https://idphoto-jp.monkos.ai/                      (OK)
https://idphoto-jp.monkos.ai/app                   ← 🔴 Disallow /app
https://idphoto-jp.monkos.ai/camera                ← 🔴 Disallow /camera
https://idphoto-jp.monkos.ai/prep                  ← 🔴 Disallow /prep
https://idphoto-jp.monkos.ai/guide/shukatsu        (OK)
https://idphoto-jp.monkos.ai/guide/app-comparison  ← 🔴 prefix 매칭 (Disallow /app)
https://idphoto-jp.monkos.ai/guide/ai              (OK)
...
```

→ **사이트맵에 robots.txt가 차단하는 페이지가 4건 포함됨** → GSC가 정확히 그것을 알린 것.

### 2-2. idphoto-kr.monkos.ai — 동일 문제

**sitemap.xml에 들어있는 차단 URL**:
- `/app`, `/camera`, `/prep` (3건)
- robots.txt 동일 패턴

### 2-3. monkos.ai (별건)

**robots.txt 차단**: `/admin`, `/api/` 만
**sitemap.xml에서 grep**: 해당 경로 0건 발견

→ **monkos.ai 메일 2건의 진짜 원인은 sitemap이 아닌 다른 곳**. 가능성:
- GSC가 발견한 비-sitemap URL(외부 링크 등)이 robots.txt 차단됨
- 동적 경로(예: `/admin/login`이 어디서 노출되어 GSC가 크롤 시도)
- sub-sitemap이 별도로 있을 가능성 (현재 1개 sitemap만 확인)
- → CDP로 GSC 색인 보고서 직접 확인 권고

---

## 3. 부수 발견 — robots.txt 위험 패턴

### 3-1. prefix 매칭 함정 ⚠️
- `Disallow: /app` → `/app-comparison`까지 차단됨 (prefix 매칭)
- `Disallow: /result` → `/result_2024` 같은 경로도 차단될 수 있음
- 안전 패턴: `Disallow: /app$` (정확) 또는 `Disallow: /app/` (디렉터리만)

### 3-2. monkos.ai의 명시적 Allow 패턴
```
Allow: /
Allow: /blog
Allow: /faq
Allow: /gallery
Allow: /board
Allow: /guide
Allow: /crop
```
→ 정상적인 robots.txt에서 Allow 명시는 불필요(Disallow가 차단 외엔 모두 Allow). 일부 봇 해석 충돌 가능성. 단순화 권고

### 3-3. AI 크롤러 환영 (좋은 패턴)
```
GPTBot / ChatGPT-User / ClaudeBot / PerplexityBot / Google-Extended / cohere-ai → Allow
```
→ AEO 트랙에 정합. chatgpt referral 8세션 발생 사실과 부합

---

## 4. 즉시 조치 액션

### 🔴 P0 (오늘 ~ 내일)
1. **idphoto-jp sitemap.xml에서 다음 URL 제거**:
   - `/app`, `/camera`, `/prep`, `/guide/app-comparison`
2. **idphoto-kr sitemap.xml에서 동일 제거**:
   - `/app`, `/camera`, `/prep`
3. **monkos.ai 색인 보고서 정밀 점검** — CDP로 GSC 색인 보고서 진입해서 정확한 차단 페이지 목록 확보

### 🟡 P1 (이번 주)
4. **robots.txt prefix 매칭 안전화**:
   - `Disallow: /app` → `Disallow: /app/$` (정확 일치) 또는 `Disallow: /app/`
   - `/guide/app-comparison`이 차단되는 사고 재발 방지
5. **4/26 동영상 schema uploadDate 시간대 추가** (`2026-04-26T10:00:00+09:00` 형식)
6. **4/22 FAQPage `mainEntity` 필드 추가** (JSON-LD schema 정비)

### 🟢 P2
7. monkos.ai robots.txt 단순화 — Allow 명시 7개 제거, Disallow만 명시

---

## 5. 영향 평가

### 손해
- idphoto-jp/kr의 `/app`, `/camera`, `/prep` 페이지가 sitemap에 있는 상태로 GSC가 매번 크롤 시도 → 차단 → 알림. **알림 노이즈만 발생, 실질 손해는 적음** (이 페이지들은 의도적으로 검색 노출 안 하는 게 맞음)
- 그러나 **`/guide/app-comparison`은 의도하지 않은 차단** = idphoto-jp의 가이드 콘텐츠가 검색 결과에 안 나옴. **실질 손해 발생**

### 이득 (수정 시)
- 알림 노이즈 종료 → 진짜 중요한 GSC 메일에 집중 가능
- `/guide/app-comparison` 정상 색인 → 일본 idphoto-jp 가이드 트래픽 회복
- robots.txt 단순화로 향후 신규 페이지 추가 시 사고 방지

---

## 6. 다음 트랙

- **K (이미 어젠다 등록)**: 알트 단일화 + 썸네일 — 트리거 시 격상
- **L (신규)**: robots.txt × sitemap 정합성 점검을 정기 작업으로 — sitemap 신규 URL 추가 시 robots.txt 차단 여부 자동 검증
- **M**: GSC 색인 보고서 CDP 정밀 점검 (monkos.ai 미해결 2건)

---

## 부록 — 호출 기록

```
Gmail MCP: search_threads × 3 (Search Console 60일/30일 + monkos.ai 30d)
Gmail MCP: get_thread × 3 (4/27 monkos.ai / 4/27 idphoto-jp / 4/26 동영상)
Bash curl: robots.txt × 3 (monkos.ai / idphoto-jp / idphoto-kr)
Bash curl: sitemap.xml × 3 (동일) + grep 차단경로
```

— iMac/민아
