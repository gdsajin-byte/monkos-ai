---
type: order
date: 2026-05-14
from: iMac/민아
to: iMac/막내2
portfolio: PF_CITADEL
proposal_ref: PROPOSAL_20260514_민아_monk.kr_종합SEO검수+네이버확장.md
prior_order: ORDER_20260514_iMac민아_막내2_monk.kr_AEO강화패키지.md
units: U-M3-Plus(Person 스키마) + U-M4(llms 갱신·필명 정정)
priority: 🟠 우선
expected_duration: 35분
status: 발행
---

# ORDER — monk.kr Person 스키마 + llms.txt/llms-full.txt 필명 정정

**[2026-05-14 15:58 KST] iMac/민아 → iMac/막내2**

---

## 0. 배경

14:29 KST 완료된 monk.kr AEO 강화 패키지(U-M1+U-N3+U-M3)에서 의도적으로 보류했던 **Person 스키마**가 작가님 결정으로 확정됨.

**결정 사항** (2026-05-14 14:34 KST 작가님 직접):
- **법적 사업자 본명(신정규/Shin JeongKyu)**: footer·등록정보·법정 영역만
- **브랜드·검색·AI 필명 "Shin-jakka"**: 그 외 일체 (Person 스키마, llms 자료 Team 섹션·FAQ·Citation 등)
- 본명·필명 **동반 표기 금지** (예: "신정규(Shin-jakka)" ❌)
- 영문 필명 표기 통일: **Shin-jakka** (하이픈 포함)

> 참조: `memory/project_persona_separation.md` (본 ORDER 발행과 동시에 적립)

---

## 1. 작업 범위 (3건 통합)

### U-M3-Plus. Person JSON-LD 추가 (필명 단독) 🟠 (15분)

대상 파일: `MONK_kr/index.html`

**삽입 위치**: 기존 BreadcrumbList JSON-LD (14:29 KST 막내2가 추가한 블록) **직후**. tailwind.config script **직전**.

**삽입 내용**:

```html
<!-- Person JSON-LD (Founder — 필명 단독, 본명 미포함) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Shin-jakka",
  "jobTitle": "Founder, Professional Photographer",
  "worksFor": {
    "@type": "Organization",
    "name": "MONK STUDIO",
    "url": "https://monk.kr"
  },
  "knowsAbout": [
    "Studio Photography",
    "AI Photo Retouching",
    "ICAO 9303 Standards",
    "Portrait Photography"
  ],
  "url": "https://monk.kr"
}
</script>
```

> ⚠️ **본명 "신정규" 또는 "Shin JeongKyu" 절대 미포함**. `alternateName` 필드도 추가하지 말 것. 필명 단일 운영 원칙.

---

### U-M4-A. `MONK_kr/llms.txt` 필명 정정 + Last updated 갱신 🟠 (5분)

대상 파일: `MONK_kr/llms.txt`

**정정 1 — Key Facts 섹션 (line 35)**:

```diff
- Founded by Shin JeongKyu (Shin-jakka), professional photographer since 2006
+ Founded by Shin-jakka, professional photographer since 2006
```

**정정 2 — Citation 섹션 (line 59)**:

```diff
- For citing this service: "MONKOS AI (monkos.ai) — AI ID Photo Platform by Shin-jakka, Monk Studio"
+ For citing this service: "MONKOS AI (monkos.ai) — AI ID Photo Platform by Shin-jakka, Monk Studio"
```

(이미 Shin-jakka 단독이므로 변경 불필요. 검토만 확인.)

**Last updated 추가** (파일 마지막 줄에 어펜드, 없으면 신설):

```markdown

---

*Last updated: 2026-05-14*
```

---

### U-M4-B. `MONK_kr/llms-full.txt` 필명 정정 + Last updated 갱신 🟠 (10분)

대상 파일: `MONK_kr/llms-full.txt`

**정정 1 — About MONKOS 섹션 (line 11)**:

```diff
- MONKOS is an AI-powered photo service platform created by Shin JeongKyu (known as Shin-jakka), a professional photographer with over 20 years of studio experience since 2006.
+ MONKOS is an AI-powered photo service platform created by Shin-jakka, a professional photographer with over 20 years of studio experience since 2006.
```

**정정 2 — Team 섹션 (line 236)**:

```diff
- **Shin JeongKyu (Shin-jakka)**: Founder, professional photographer since 2006, AI architect
+ **Shin-jakka**: Founder, professional photographer since 2006, AI architect
```

**유지 (정정 금지) — Company Information § Representative (line 227)**:

```
**Representative**: Shin JeongKyu
```

> ⚠️ Company Information의 "Representative" 필드는 **사업자 등록 정보 영역**. 작가님 결정 "사업자 푸터에 나오는것과 필명은 다르게" 원칙 적용 — **본명 유지**. 변경하지 말 것.

**Last updated 갱신 (line 273)**:

```diff
- *Last updated: 2026-03-26*
+ *Last updated: 2026-05-14*
```

**전수 검증**: 위 정정 외 파일 내 "Shin JeongKyu" 추가 출현 시 보고. 임의 정정 금지 — 본 ORDER에 명시된 위치만 정정.

---

## 2. 배포

CF Pages 자동 배포 (직전 14:22 ORDER와 동일 메커니즘):

1. 3건 수정 완료
2. `git add MONK_kr/index.html MONK_kr/llms.txt MONK_kr/llms-full.txt`
3. `git commit -m "[feat] monk.kr Person 스키마 + llms 필명 정정 — Shin-jakka 단일 표기"`
4. `git push origin main`
5. CF Pages 빌드 자동 트리거. 14:22 ORDER에서 7분 지연 사례 있었으므로 5분 경과 시 `wrangler pages deploy` 수동 실행 가능

---

## 3. 검증

배포 완료 후 curl 4건 + Rich Results Test (선택):

```bash
# 1. Person JSON-LD 응답
curl -s https://monk.kr/ | grep -c '"@type": "Person"'
# 기대: 1

# 2. Person 본문 — 필명 확인 + 본명 미노출 확인
curl -s https://monk.kr/ | grep -A 1 '"@type": "Person"' | grep -E '"name"|JeongKyu'
# 기대: "name": "Shin-jakka" / "JeongKyu" 0건

# 3. llms.txt 정정 확인
curl -s https://monk.kr/llms.txt | grep -E "JeongKyu|Shin-jakka"
# 기대: JeongKyu 0건, Shin-jakka 다수

# 4. llms-full.txt 정정 확인
curl -s https://monk.kr/llms-full.txt | grep -E "JeongKyu|Shin-jakka" | head -10
# 기대: JeongKyu 1건만(Representative 필드), Shin-jakka 다수
# Last updated: 2026-05-14 확인
curl -s https://monk.kr/llms-full.txt | grep "Last updated"
```

추가 검증 (선택, CDP 가능 시):
- Google Rich Results Test (`https://search.google.com/test/rich-results`)에 https://monk.kr/ 입력 → Person 감지 확인

---

## 4. ⚠️ 준수 조항

- **헌법 4조 1항** — 비밀정보 추측·생성 금지
- **헌법 4조 2항** — 파괴적 명령 금지
- **헌법 4조 3항** — 내부 호칭 노출 금지
- **헌법 5장 2조** — N/A (CF Pages)
- **헌법 1조 3항 (정체성 보존)** — 필명·본명 분리 원칙 엄격 준수. 본 ORDER 명시 위치 외 임의 정정 금지
- **memory/project_persona_separation.md** 원칙 준수 — 본명·필명 동반 표기 금지
- 커밋 카테고리 `[feat]` (헌법 ch6)

---

## 5. 산출물 요구

### 코드
- `MONK_kr/index.html` — Person JSON-LD 1블록 추가
- `MONK_kr/llms.txt` — Key Facts·Citation 정정 + Last updated 추가
- `MONK_kr/llms-full.txt` — About·Team 정정 + Last updated 갱신 + Representative 유지

### 커밋
- 단일 커밋
- 푸시까지 완료

### 보고
- **COMPLETION 파일**: `monkos-ops/ops/reports/2026-05/COMPLETION_20260514_막내2_monk.kr_Person+llms필명정정.md`
- frontmatter 필수 (type/date/device/agent/portfolio/order/status)
- curl 4건 검증 결과 표 포함
- CF Pages 빌드 ID 또는 배포 시각 명시
- 전수 검증 결과: "JeongKyu" 최종 노출 빈도 (llms-full.txt Representative 1건만 허용, 그 외 0건 확인)
- 발견된 이슈·예외사항 명시

### 보고 형식
- `✅❌💡⏳📁🔀` 형식
- 수발신 헤더: `**[YYYY-MM-DD HH:MM KST]** iMac/막내2 → iMac/민아, 작가님`

---

## 6. 예상 소요 시간

| 작업 | 소요 |
|------|------|
| U-M3-Plus Person JSON-LD | 15분 |
| U-M4-A llms.txt 정정 | 5분 |
| U-M4-B llms-full.txt 정정 | 10분 |
| 커밋+푸시 + CF Pages 빌드 | 5분 |
| 검증 curl 4건 + 보고 | 10분 |
| **합계** | **~45분** |

---

## 7. 후속 단위 (본 ORDER 완료 후 별도 환급 예정)

- **U-M2** `_headers` 보안 헤더 (별도 ORDER)
- **U-N1** 네이버 Search Advisor sitemap 제출 (작가님 또는 민아 위임)
- **U-N2** 네이버 플레이스 등록 (작가님 직접) ⭐
- **U-M5** monk.kr 하위 페이지 검수 (별건 RESEARCH)
- **monkos.ai 라인 본명→필명 정합**: portal/idphoto-kr/jp 자산 점검 별건 (작가님 결정 적용 범위 확장)

---

*[2026-05-14 15:58 KST] iMac/민아 발행. 막내2 수신 대기.*
