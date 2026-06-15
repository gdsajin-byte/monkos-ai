---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내
subject: "portal 재배포 + 정크 슬러그 3건 리슬러그 — 색인 최적화 마감"
status: 발행
portfolio: PF_SPECS
priority: 즉시
---

# 지시서 — portal 재배포 + 정크 슬러그 리슬러그

> **[2026-06-15 17:41 KST] iMac/쌍아 → iMac/막내**
> 작가님 지시: 즉시 처리.

---

## 임무 1 — portal 재배포

main에 머지 완료된 변경분(PR #74 회귀 수정 포함)이 prod에 미반영.

```bash
cd monkos_AI/portal && ./deploy.sh prod
```

배포 후 검증:
- `curl -s "https://monkos.ai/sitemap-blog.xml" | grep -E "blog/(14-vs|5-10|47-20x)"` → 0건 확인
- `curl -s -o /dev/null -w "%{http_code}" "https://monkos.ai/monk_studio"` → 410 확인

## 임무 2 — 정크 슬러그 3건 리슬러그

실콘텐츠가 있는데 슬러그가 깨져서 색인 불가 상태인 3건을 정상 슬러그로 교체.

| 현재 슬러그 | 타이틀 | 새 슬러그 (제안) |
|------------|--------|---------------|
| `47-20x` | 오퍼스 4.7 도대체 무엇이 문제인가?(클로드맥스 20X 사용자) | `claude-opus-47-what-went-wrong-max-20x-user` |
| `14-vs` | [한연구원 매거진 14] 한국 vs 일본 취업사진 헤어, 왜 이렇게 다를까? | `korea-vs-japan-job-photo-hairstyle-difference` |
| `5-10` | 면접 올림머리 완성 5단계 — 현장 경력 10년의 고정 노하우 | `interview-updo-hairstyle-5-steps-10-year-pro-tips` |

### 리슬러그 절차

1. **Firestore에서 해당 문서의 slug 필드 변경** — 기존 slug doc 유지 + 새 slug doc 생성 (또는 rename)
   - ⚠️ Firestore 직접 접근이 필요한 작업 — 코드 레벨에서 처리 가능한지 확인
   - blog.js에 admin 리슬러그 함수가 있으면 활용, 없으면 스크립트 작성

2. **기존 slug → 새 slug 301 리다이렉트 추가** — `lib/cms/redirects.js`의 `BLOG_REDIRECTS`에 3건 추가:
   ```js
   '/blog/47-20x': '/blog/claude-opus-47-what-went-wrong-max-20x-user',
   '/blog/14-vs': '/blog/korea-vs-japan-job-photo-hairstyle-difference',
   '/blog/5-10': '/blog/interview-updo-hairstyle-5-steps-10-year-pro-tips',
   ```

3. **번역본도 확인** — JA/EN 버전이 있으면 동일하게 리슬러그

4. **사이트맵 자동 반영** — 새 슬러그는 `isIndexableBlogUrl` 통과하므로 자동 포함

### 검증

- 새 슬러그 URL 200 확인
- 기존 슬러그 URL 301 → 새 슬러그 확인
- 사이트맵에 새 슬러그 포함 확인

## 임무 3 — 재배포

리슬러그 + 301 추가 후 deploy.sh prod 재배포.

---

## 산출물

1. 배포 2회 (임무 1 + 임무 3)
2. redirects.js 변경
3. Firestore 슬러그 변경 (방법에 따라)
4. COMPLETION 보고서
5. 커밋

---

## ⚠️ 준수 조항

- ch5 2조: 배포는 deploy.sh 경유
- ch4 10조: Firestore 직접 접근 시 scripts/credits.sh 준용 (크레딧 아닌 블로그 데이터이므로 적용 범위 확인 필요 — 불확실하면 보고 후 대기)
- 새 슬러그는 영문 소문자 + 숫자 + 하이픈만, 4자 이상
