---
type: completion
date: 2026-08-01
device: iMac
agent: 막내1
status: 마감
portfolio: PF_FACEREAD
---

# COMPLETION — 어드민 관상 리포트 카드 + /proto/* noindex 헤더

**[2026-08-01 18:35 KST]** iMac/막내1 → 작가님

> 작가님 직접 지시(경로②, 18:31) — ① admin/index.html 내부 도구에 관상 리포트 카드 ② `/proto/*`에 `X-Robots-Tag: noindex` 1행(robots Disallow 금지) ③ prod 배포 후 rev 보고.

## 1. 결과

**prod `monkos-portal-00540-jvq` → `monkos-portal-00541-8qh` 트래픽 100%.** 커밋 `8f01e66e`.

## 2. 변경

| # | 파일 | 내용 |
|---|------|------|
| ① | `public/admin/index.html` | 「내부 도구」 그리드 말미에 카드 1개 — `🔮` / `관상 리포트 [INTERNAL]` / `사주×관상 얼굴 지도` → `/admin/gwansang.html`. 기존 카드 마크업·클래스 그대로 준용, CSS 신설 0 |
| ② | `server.js` 정적 서빙 | 200 응답 헤더 조립부에 `filePath.startsWith('/proto/')` → `X-Robots-Tag: noindex, nofollow` 1행. **robots.txt 무수정**(지시) |

지시대로 `robots.txt`에 `Disallow`를 걸지 않았다. 헤더 방식이 목적에 더 맞기도 하다 — `Disallow`는 크롤만 막고 색인 자체는 막지 못하며, 이미 수집된 URL의 색인 해제도 되지 않는다. 코드 주석에 이 근거를 남겼다.

## 3. 라이브 검증 (prod)

| 표면 | 결과 |
|------|------|
| `/admin/` 카드 렌더 | ✅ `🔮` · `관상 리포트 <span class="badge-internal">INTERNAL</span>` · `사주×관상 얼굴 지도` · `href="/admin/gwansang.html"` 전부 확인 |
| `/proto/hero-demo.html` | 200 + **`x-robots-tag: noindex, nofollow`** |
| `/` · `/specs/passport/kr` · `/js/specs-funnel.js` | 200 · `x-robots-tag` **미부착**(누출 없음) |

## 4. ⏳ 보고 후 대기 — 지시 범위 밖 발견 1건

**`/proto/`의 한글 파일명 이미지 10장이 전부 404다.** (`히어로이미지_셀카.webp` 등 — 퍼센트 인코딩으로 요청해도 404)

- 원인: 정적 서빙이 `req.url`을 **디코드 없이** 그대로 경로로 쓴다(`server.js:1280` `let filePath = req.url === '/' ? '/index.html' : req.url;`). 비ASCII 파일명은 `%ED%9E%88…` 리터럴을 찾다가 실패한다
- 대조: 같은 디렉터리 규칙의 ASCII 파일 `/admin/img/gwansang-demo.jpg`는 200 — 경로 문제가 아니라 **디코드 누락**이다
- 범위: 이번 지시(카드·헤더)와 무관한 **기존 정적 서버 결함**이며, `3819809d`(히어로 프로토)가 한글 파일명을 처음 올리며 드러났다. 내 변경은 200 응답에 헤더만 더할 뿐 404 경로에 관여하지 않는다
- 현 상태: `hero-demo.html`은 열리지만 **이미지가 전부 깨진 채로 뜬다**
- 수정안(1행): `filePath` 산출 시 `try { filePath = decodeURIComponent(filePath); } catch {}` — 다만 전 정적 표면에 걸리는 공용부라 임의로 손대지 않았다. 지시 주시면 처리하겠다

## 5. 롤백

```
gcloud run services update-traffic monkos-portal --region us-central1 \
  --to-revisions monkos-portal-00540-jvq=100
```
