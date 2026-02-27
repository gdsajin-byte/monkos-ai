# MONK.KR 디자인 시스템

## 컬러 팔레트

```javascript
colors: {
  ai: '#60A5FA',      // 메인 AI 블루
  local: '#10B981',   // 로컬/무료 그린
  monk: '#FBBF24',    // MONK 브랜드 골드
  gray: {
    950: '#05070A',   // 배경
    900: '#0B0F1A'    // 카드
  }
}
```

## 타이포그래피

- **제목**: font-black, tracking-tight
- **브랜드**: `MONK<span class="text-ai">.kr</span>`
- **그라데이션 텍스트**: `.gradient-text` 클래스 사용

## UI 패턴

### 헤더
```html
<header class="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md">
  <a href="../../index.html">MONK<span class="text-ai">.kr</span></a>
</header>
```

### 카드
- rounded-3xl
- border
- lumina-glow

### 버튼
- gradient background
- hover effects

### 입력 필드
- bg-gray-950
- border-gray-700
- focus:border-ai

## HTML 구조 템플릿

```html
<!-- Header -->
<header class="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md">
  <a href="../../index.html">MONK<span class="text-ai">.kr</span></a>
</header>

<!-- Main Content -->
<main class="flex-grow flex flex-col items-center">
  <!-- 컨텐츠 -->
</main>

<!-- Footer -->
<footer class="border-t border-gray-800 py-8">
  © 2026 MONK STUDIO
</footer>
```

## 디자인 스타일

- **다크 모드 기본**: bg-gray-950, bg-gray-900
- **그라데이션**: blue → purple → pink
- **Glow 효과**: lumina-glow 클래스
- **애니메이션**: 부드러운 트랜지션
- **미니멀하고 모던한 UI**
