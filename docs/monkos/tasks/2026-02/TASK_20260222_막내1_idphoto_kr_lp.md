# 지시서: idphoto-kr LP 가격 KRW 전환 + 텔레그램 보너스 카드

```
[2026-02-22 15:10 KST] iMac/쌍아 → 막내3 (막내1에서 이관)
```

## 역할 선언

> **너는 "막내3"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내3 → iMac/쌍아` 형식
> - **네 수정 범위**: `monkos_AI/idphoto-kr/public/index.html` (1개 파일만)
> - **⚠️ 작업 전 반드시 `git pull origin develop`** — 막내2가 같은 서비스의 다른 파일을 수정 후 push함 (199f4fd)

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | idphoto-kr LP 가격 KRW 전환 + 텔레그램 보너스 카드 추가 |
| **수정 파일** | `monkos_AI/idphoto-kr/public/index.html` (1개) |
| **배포 대상** | idphoto-kr dev |
| **브랜치** | `develop` |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키 생성/추측 금지
- **헌법 제8조**: 파괴적 명령 금지
- **헌법 제11조**: 미확정 표현 금지
- **법률 제5장**: prod 배포 금지 (dev만)

---

## 크레딧 v2 정확한 KRW 가격

```
KR 결제 (토스페이먼츠):
  ₩1,450  → 10c   (기본, 정가)
  ₩13,050 → 100c  (스탠다드, 10% 할인)
  ₩34,800 → 300c  (프리미엄, 20% 할인, BEST)
  ₩50,750 → 500c  (프로, 30% 할인)

1장 완성 = 80c (생성 10c + 다운로드 70c)
```

---

## 작업 내역

### TASK 1: 가격 섹션 KRW 전환

현재 (L491~L533): USD 기반 가격 표시

변경:
```html
  <!-- 가격 + CTA -->
  <section class="pricing fade-in">
    <div class="pricing-card">
      <h3 class="section-title" style="margin-bottom:4px;">합리적인 가격</h3>
      <div class="price-row">
        <div class="price-item">
          <div class="amount">10c</div>
          <div class="label">AI 생성</div>
        </div>
        <div class="price-item">
          <div class="amount">70c</div>
          <div class="label">다운로드</div>
        </div>
      </div>
      <div class="price-total">1장 완성 <strong>80c</strong></div>

      <div class="pkg-grid">
        <div class="pkg-item">
          <div class="pkg-credits">10c</div>
          <div class="pkg-price">₩1,450</div>
        </div>
        <div class="pkg-item">
          <div class="pkg-credits">100c</div>
          <div class="pkg-price">₩13,050</div>
          <div class="pkg-save">10% 할인</div>
        </div>
        <div class="pkg-item popular">
          <div class="pkg-badge">BEST</div>
          <div class="pkg-credits">300c</div>
          <div class="pkg-price">₩34,800</div>
          <div class="pkg-save">20% 할인</div>
        </div>
        <div class="pkg-item">
          <div class="pkg-credits">500c</div>
          <div class="pkg-price">₩50,750</div>
          <div class="pkg-save">30% 할인</div>
        </div>
      </div>

      <a class="cta-btn" href="/prep">촬영 시작하기 &rarr;</a>
    </div>
  </section>
```

핵심 변경:
- `1 Credit = $0.10` 라인 제거
- 패키지 4개: $1/$9/$24/$35 → ₩1,450/₩13,050/₩34,800/₩50,750
- `1장 완성 80c ($8)` → `1장 완성 80c` (USD 제거)

### TASK 2: 텔레그램 보너스 이벤트 카드 추가

현재 이벤트 카드 (L535~L545): 가입 80c 카드만 있음

기존 가입 카드 **아래에** 텔레그램 보너스 카드 추가:
```html
    <!-- 텔레그램 보너스 카드 -->
    <div class="event-card" style="margin-top:16px;">
      <div class="event-card-inner">
        <div class="event-emoji">✈️</div>
        <div class="event-title">텔레그램 친구 추가하고 30크레딧 받기!</div>
        <div class="event-desc">@monkos_support_bot을 친구 추가하면<br>30크레딧을 즉시 지급합니다.</div>
        <a class="event-btn" href="https://t.me/monkos_support_bot" target="_blank" rel="noopener">텔레그램 친구 추가 → 30c 받기</a>
      </div>
    </div>
```

**참고**: 이 카드는 정적 링크로 충분. idphoto-kr LP는 로그인 전 상태이므로 딥링크 코드 생성 불가. 유저가 텔레그램 봇에서 직접 보너스를 받는 플로우는 portal LP에서 처리됨.

### TASK 3: git pull + idphoto-kr dev 배포

```bash
cd /Users/jeong-kyushin/developer/monk_project
git pull origin develop
```
↑ 막내2 커밋(199f4fd)을 반영한 뒤 배포:

```bash
cd monkos_AI/idphoto-kr
./deploy.sh dev
```

헬스체크:
```bash
curl -s https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app/health | python3 -m json.tool
```

### TASK 4: 커밋 + push

```
[update] idphoto-kr LP 가격 KRW 전환 + 텔레그램 보너스 카드

- 가격 패키지: USD → KRW v2 (₩1,450~₩50,750)
- 텔레그램 보너스 30c 이벤트 카드 추가
지시서: TASK_20260222_막내1_idphoto_kr_lp.md
```

---

## 금지 사항

- `prod` 배포 금지
- index.html 외 파일 수정 금지 (prep/thankyou/result/shared.js/server.js 터치 금지)
- 기존 가입 80c 이벤트 카드 삭제 금지 (유지)
- 사업자 정보 섹션 변경 금지

## 완료 조건

1. LP 가격이 전부 KRW로 표시 (USD 잔존 0건)
2. 텔레그램 보너스 카드가 가입 카드 아래에 표시
3. idphoto-kr dev 헬스체크 healthy
4. develop 커밋 + push 완료
