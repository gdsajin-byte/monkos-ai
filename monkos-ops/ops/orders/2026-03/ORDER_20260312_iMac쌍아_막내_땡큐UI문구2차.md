---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: 땡큐 페이지 UI 문구 2차 수정 3건
priority: P1
category: 프론트엔드
---

# 지시서: 땡큐 페이지 UI 문구 2차 수정 3건

> **[2026-03-12 17:46 KST]** iMac/쌍아 → iMac/막내
> 출처: 작가님 프로덕션 테스트 피드백 (rev 00154)

---

## 변경 1: 서브텍스트 — 크롭 안내 문구 강화

현재 한 줄이 너무 짧아서 노크롭 원본임을 인지하기 어려움.

### thankyou.html 405행

```html
<!-- 현재 -->
<div class="ty-celebration-sub">원본 다운로드 또는 규격 맞춤 자르기를 선택하세요</div>

<!-- 변경 — 2줄 구성 -->
<div class="ty-celebration-sub">
    본 사진은 자르기가 되지 않은 풀사이즈 원본입니다<br>
    여권(3.5×4.5) 또는 반명함(3×4) 규격이 필요하시면<br>
    <strong style="color:#B4A0FF;">규격 맞춤 자르기</strong>를 선택해 주세요
</div>
```

---

## 변경 2: 다운로드 버튼 문구

"최종 원본"이 모호 → "풀 사이즈 원본 (No Crop)" 으로 명확화.

### thankyou.html 417행

```html
<!-- 현재 -->
<button class="ty-download-btn" id="btn-ty-download">📥 최종 원본 다운로드</button>

<!-- 변경 -->
<button class="ty-download-btn" id="btn-ty-download">📥 풀 사이즈 원본 다운로드 (No Crop)</button>
```

---

## 변경 3: 하단 저장 안내 → 데이터 저장 정책 링크 버튼

인라인 설명 대신, 별도 정책 페이지로 연결하는 버튼으로 교체.
정책 페이지(`/policy/data`)는 아직 미구현 → 일단 경로만 세팅. 클릭 시 새 탭 오픈.

### thankyou.html 435-441행

```html
<!-- 현재 -->
<!-- 파일 저장 기간 안내 -->
<div class="ty-storage-notice" style="padding:10px 16px; margin:0 16px; background:#111827; border:1px solid #1E293B; border-radius:12px; text-align:center;">
    <div style="font-size:11px; color:#64748B; line-height:1.5;">
        📂 다운로드한 파일은 기기에 저장됩니다<br>
        서버 보관: 촬영일로부터 <strong style="color:#94A3B8;">7일</strong> 이내
    </div>
</div>

<!-- 변경 — 정책 페이지 링크 버튼 -->
<a href="/policy/data" target="_blank" rel="noopener"
   style="display:block; padding:10px 16px; margin:0 16px; background:#111827; border:1px solid #1E293B; border-radius:12px; text-align:center; text-decoration:none; cursor:pointer;">
    <div style="font-size:11px; color:#64748B; line-height:1.5;">
        📂 다운로드한 파일은 고객님의 기기에 저장됩니다
    </div>
    <div style="font-size:11px; color:#6C5CE7; font-weight:600; margin-top:4px;">
        데이터 저장 정책 보기 →
    </div>
</a>
```

> ⚠️ `/policy/data` 경로는 현재 미구현. 404 뜰 수 있음. 정책 페이지 신설은 별도 후속 작업.

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/인프라 수정 금지
- HTML만 수정. JS 변경 없음.

## 커밋 + 배포

- 1커밋으로 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**
