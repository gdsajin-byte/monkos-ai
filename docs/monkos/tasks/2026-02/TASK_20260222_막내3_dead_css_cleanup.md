# 지시서: dead CSS 정리 (#style-bar)

> [2026-02-22 17:20 KST] iMac/쌍아 → 막내3

## 역할 선언
> **너는 "막내3호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내3 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 법률 제2장 (코딩 규칙): dead code 정리

## 배경
app.css에 `#style-bar` + `.style-chip` CSS가 남아있으나 MPA camera.html에서 사용하지 않음 (레거시 SPA 전용). _legacy_spa/에서만 참조.

## 작업

### 1. app.css에서 #style-bar 블록 제거

**파일**: `monkos_AI/idphoto-kr/public/app.css` (L407~L422)

제거 대상:
```css
/* 스타일 선택 바 (카메라 화면) */
#style-bar {
    position: absolute; top: 12px; left: 12px; right: 12px;
    display: flex; gap: 6px; z-index: 8;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
}
.style-chip {
    padding: 6px 14px; border-radius: 20px;
    background: rgba(0,0,0,0.7); border: 1px solid #333;
    font-size: 12px; color: #aaa; white-space: nowrap;
    cursor: pointer; transition: all 0.2s;
}
.style-chip.active {
    background: rgba(167,139,250,0.2);
    border-color: #a78bfa; color: #a78bfa;
}
```

### 2. 검증
- MPA 5개 HTML에서 `style-bar`, `style-chip` grep → 0건 확인
- _legacy_spa/는 자체 인라인 CSS이므로 영향 없음

### 3. 커밋+push
```bash
git add monkos_AI/idphoto-kr/public/app.css
git commit -m "[cleanup] idphoto-kr dead CSS 제거 — #style-bar (레거시 SPA 전용)"
git push origin develop
```

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | `monkos_AI/idphoto-kr/public/app.css` |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |
