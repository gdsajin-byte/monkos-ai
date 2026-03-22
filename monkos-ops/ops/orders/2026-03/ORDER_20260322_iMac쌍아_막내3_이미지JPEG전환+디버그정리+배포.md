---
type: order
from: iMac/쌍아
to: 막내3
date: 2026-03-22
status: 대기
priority: 높음
---

# 지시서: 이미지 JPEG 전환 + 디버그 로그 정리 + 통합 배포

> **[2026-03-22 15:48 KST] iMac/쌍아 → 막내3**

## 대상 파일

- `monkos_AI/portal/lib/cms/upload.js`
- `monkos_AI/portal/public/admin/js/blog-image.js` — 디버그 로그 제거만
- `monkos_AI/portal/public/admin/js/blog-editor.js` — 디버그 로그 제거만

**다른 막내가 수정하는 파일(render.js, translate.js, blog.js의 로직 부분)은 절대 건드리지 말 것.**

## 수정 1: upload.js — WebP → JPEG 전환

### upload.js:171-176

**현재:**
```javascript
    // WebP 변환 (GIF 제외 — 애니메이션 손실 방지)
    if (filePart.contentType !== 'image/gif') {
      imageData = await sharp(filePart.data).webp({ quality: 85 }).toBuffer();
      uploadContentType = 'image/webp';
      fileName = fileName.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
```

**변경:**
```javascript
    // JPEG 변환 (GIF 제외 — 애니메이션 손실 방지)
    // JPEG 통일: 외부 배포 호환 (Medium, 카카오톡 등 WebP 미지원 플랫폼 대응)
    if (filePart.contentType !== 'image/gif') {
      imageData = await sharp(filePart.data).jpeg({ quality: 85 }).toBuffer();
      uploadContentType = 'image/jpeg';
      fileName = fileName.replace(/\.(png|webp)$/i, '.jpg');
      if (!fileName.match(/\.jpe?g$/i)) fileName += '.jpg';
    }
```

### upload.js:187 — 로그 메시지 보정

**현재:**
```javascript
log(`[CMS] 이미지 업로드: ${gcsPath} (${...}${uploadContentType === 'image/webp' ? ' webp' : ''})`);
```

**변경:**
```javascript
log(`[CMS] 이미지 업로드: ${gcsPath} (${(filePart.data.length / 1024).toFixed(1)}KB → ${(imageData.length / 1024).toFixed(1)}KB jpeg)`);
```

## 수정 2: 디버그 로그 정리

### blog-image.js — console.log/console.error/console.warn 제거

아래 디버그 로그들을 제거:

- 50행: `console.log('[insertImage] 호출', ...);` → 삭제
- 53행: `console.error('[insertImage] editor 없음');` → 삭제
- 63행: `console.error('[insertImage] 에러:', err);` → 삭제
- 70행: `console.error('[insertImage] 폴백도 실패:', err2);` → 삭제
- 297행: `console.warn('[blog-image] editor 미초기화 — 재시도 대기');` → 삭제

**주의**: `showToast()` 호출과 try-catch 구조는 유지. console 출력만 제거.

### blog-editor.js — initEditor 디버그 로그 제거

- 16행: `console.log('[blog-editor] initEditor 시작, toastui:', typeof toastui);` → 삭제
- 51행: `console.log('[blog-editor] initEditor 완료, editor:', !!editor);` → 삭제

## 수정 3: 통합 배포

**막내1, 막내2의 작업 완료를 확인한 후** 통합 배포:

```bash
# 1. 전원 커밋 확인
git status
git log --oneline -5

# 2. 자기 파일 커밋
git add monkos_AI/portal/lib/cms/upload.js monkos_AI/portal/public/admin/js/blog-image.js monkos_AI/portal/public/admin/js/blog-editor.js
git commit -m "[fix] 이미지 JPEG전환 + 디버그로그 정리"

# 3. 통합 배포
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

```bash
# 1. GA 태그 확인 (막내1 작업)
curl -s https://monkos.ai/blog | grep "gtag"

# 2. JPEG 업로드 테스트 — 어드민에서 이미지 업로드 후 URL 확인
# URL이 .jpg로 끝나야 함 (.webp가 아님)

# 3. 디버그 로그 제거 확인
curl -s https://monkos.ai/admin/js/blog-image.js | grep "console\."
# 결과 없어야 함

# 4. hreflang 확인 (막내1 작업)
curl -s https://monkos.ai/blog | grep "hreflang"

# 5. 색인 ping 확인 — 새 포스트 발행 후 서버 로그에 "sitemap ping" 출력
```

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- **upload.js + 디버그 로그 정리만 수정. 다른 로직 절대 금지**
- 배포는 반드시 막내1·2 작업 완료 후. 미완료 시 대기.
- 배포 후 검증 5건 실행하여 결과 보고
