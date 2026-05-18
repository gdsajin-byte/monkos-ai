# MONK.KR 코딩 가이드

## 네이밍 컨벤션

- **HTML/CSS**: kebab-case (`prompt-input`, `generate-btn`)
- **JavaScript**: camelCase (`generateImage`, `downloadImage`)
- **파일명**: snake_case (한글 가능: `so_so.html`)

## JavaScript 규칙

### 기본 원칙
- 순수 JavaScript 사용 (라이브러리 미사용)
- async/await 패턴 사용
- 에러 핸들링 필수
- UI 상태 업데이트 (loading, success, error)

### API 통신 패턴
```javascript
const response = await fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, aspectRatio, style })
});

if (!response.ok) {
  throw new Error(`API 오류: ${response.status}`);
}

const data = await response.json();
```

## 다국어 지원

```html
<select id="language">
  <option value="ko">🇰🇷 한국어</option>
  <option value="en">🇺🇸 English</option>
  <option value="ja">🇯🇵 日本語</option>
  <option value="zh">🇨🇳 中文</option>
</select>
```

## 작업 원칙

1. **일관성**: 기존 디자인 시스템 준수
2. **반응형**: mobile-first, Tailwind breakpoints 활용
3. **성능**: CDN 사용, 최적화된 이미지
4. **UX**: 명확한 피드백, 로딩 상태 표시
5. **접근성**: 의미있는 HTML, alt 텍스트 필수
6. **한국어 우선**: UI 텍스트, 주석, 에러 메시지 모두 한국어

## 디렉토리 구조 규칙

- 각 서브 디렉토리마다 디렉토리명과 동일한 HTML 생성
- 각 디렉토리마다 `images/` 폴더 필수
- 일관된 네비게이션: `← Back to AI LAB` 등
