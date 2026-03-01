---
type: ORDER
date: 2026-03-01
from: iMac/쌍아
to: 막내 (배정 대기)
priority: P2
scope: idphoto-kr 프론트 구조 개선 (modules/gate.js, mission.js, charge.js, result.js)
---

# 지시서: P2 — 프론트 구조 개선 (gate/mission 제거 + charge 패키지 + 다운로드 플로우)

> **[2026-03-01 15:20 KST] iMac/쌍아 → 막내**
> **긴급도**: P2 — 구조 개선 (서비스 안정화 후 실행)
> **범위**: `monkos_AI/idphoto-kr/public/` 내 4개 파일 + 1개 삭제
> **배포**: Cloud Run `monkos-idphoto-kr` 재배포 (정적 파일이므로 GCS 업로드 or CF Pages)

---

## 배경

오늘 세션에서 확정된 플로우 재설계:
- **기존**: 비로그인 다운로드 → gate.js Phase1(로그인 30c) + Phase2(채널가입 40c) = 70c 달성 → 다운로드
- **신규**: 진입 시 로그인 유도(10c 보너스) → 생성 → 프리뷰 → 다운로드(순수 과금 70c) → 마지막 페이지(이벤트+충전)

핵심 변경:
1. gate.js Phase1/Phase2 **전면 제거** — 다운로드 = 순수 과금
2. mission.js 3단계 **전면 제거** — 마지막 페이지에 간소화 SNS 이벤트로 대체
3. charge.js 패키지 **70c/160c/340c** 3단 구조로 변경 (보너스 크레딧 포함)
4. result.js 다운로드 플로우 간소화

### 과금 설계 원칙
- **1장 = 생성 10c + 다운로드 70c = 80c** (불변)
- 패키지는 80c 단위로 딱 떨어지게 설계
- 보너스 크레딧으로 "N장 사용 가능" 명확화
- 프리미엄만 잔여 20c → 풀샷 원본 1회 무료 = BEST 배지 근거

---

## 작업 1: gate.js — Phase1/Phase2 제거, 핵심 유틸만 보존

### 제거 대상 (함수/UI 전부)
- `GateModule.show()` — Phase1/Phase2 전체 팝업 (라인 580~694)
- `_startKakaoLogin()` (라인 88~113)
- `_onKakaoLoginSuccess()` (라인 115~150)
- `_requestEventCredit()` (라인 153~171)
- `_markChannelDone()` (라인 174~185)
- `_handleKakaoChannel()`, `_loadKakaoSDK()` (라인 188~238)
- `_handleTelegramJoin()`, `_verifyTelegramJoin()` (라인 241~286)
- `_switchToKakao()`, `_selectChannel()` (라인 289~316)
- `_updateUI()` (라인 75~85)
- `_gateCredits`, `_channelDone`, `_tgFallbackTimer` 내부 상태 (라인 59~63)
- GATE_CSS 중 `.gate-card`, `.gate-checklist`, `.gate-check`, `.gate-progress`, `.gate-ch-*`, `.gate-tg-*` 관련 스타일

### 보존 대상
| 함수 | 용도 | 현재 위치 |
|------|------|----------|
| `showLoginRequired(message)` | 카메라 진입 시 로그인 유도 / 비로그인 재생성 차단 | 라인 380~453 |
| `closeLoginRequired()` | 로그인 모달 닫기 | 라인 455~458 |
| `_startGoogleLoginSimple()` | Google 로그인 (모달 내) | 라인 513~557 |
| `_startKakaoLoginSimple()` | 카카오 로그인 (모달 내) | 라인 460~484 |
| `_startLineLoginSimple()` | LINE 로그인 (모달 내) | 라인 486~510 |
| `initDirectPayment(callback)` | 토스 단건 결제 리다이렉트 처리 | 라인 705~707 |
| `_initDirectPaymentResult()` | 토스 리다이렉트 복귀 핸들러 | 라인 347~377 |
| `_buyDirect()` | 비로그인 직결제 (₩9,900) | 라인 319~344 |

### 수정 사항

**① `_buyDirect()` 금액 변경**
```javascript
// 기존: amount: 10150
// 변경:
amount: 9900,
orderName: 'MONKOS AI 증명사진 다운로드 1장',
```

**② `GateModule.show()` → 제거 또는 빈 함수**
```javascript
show() {
  // Phase1/Phase2 제거됨 — 이 메서드는 더 이상 사용하지 않음
  console.warn('[Gate] show() is deprecated');
},
```

**③ `buyDirect()` 외부 노출 추가**
result.js에서 비로그인 직결제를 호출할 수 있도록:
```javascript
export const GateModule = {
  // ... 기존 보존 메서드들 ...
  buyDirect() {
    _buyDirect();
  },
};
```

### 최종 gate.js Export 구조
```javascript
export const GateModule = {
  show()              → deprecated (빈 함수 또는 제거)
  close()             → 유지 (하위호환)
  showLoginRequired() → 유지
  closeLoginRequired()→ 유지
  initDirectPayment() → 유지
  buyDirect()         → 신규 (비로그인 직결제 노출)
};
```

---

## 작업 2: mission.js — 전면 제거

### 조치
1. `modules/mission.js` 파일 내용 전부 제거하고 빈 export만 남김:
```javascript
/**
 * modules/mission.js — DEPRECATED
 * P2 구조 개선으로 제거됨 (2026-03-01)
 * 대체: 마지막 페이지 SNS 이벤트 (result.js 내)
 */
export const MissionModule = {
  mount() {},
  unmount() {},
};
```

> **파일 자체를 삭제하지 않는 이유**: result.js:15에서 import 중. 빈 export로 하위호환 유지. 향후 정리 시 삭제.

### result.js 연동
- `result.js:448` `MissionModule.mount(mount)` 호출 → 빈 함수이므로 무해. 추후 제거 가능.
- `store.showMission`, `store.missionConsentDone` → 더 이상 사용 안 함. 방치 (shared.js 정리는 별도).

---

## 작업 3: charge.js — 패키지 구조 변경

### 과금 구조: 1장 = 80c (생성 10c + 다운로드 70c)

| 패키지 | 결제(₩) | 구매 크레딧 | 보너스 | **총 지급** | 사용 가능 | 잔여 |
|--------|---------|-----------|--------|-----------|----------|------|
| 기본 | ₩9,900 | 70c | +10c(가입) | **80c** | 증명사진 1장 | 0c |
| 스탠다드 | ₩18,900 | 140c | **+20c** | **160c** | 증명사진 2장 | 0c |
| 프리미엄 ★BEST | ₩34,900 | 280c | **+60c** | **340c** | 증명사진 4장 | 20c (풀샷 원본 1회) |

> **기본 70c 구매자**: 가입보너스 10c가 이미 있으므로 총 80c = 1장 딱 맞음.
> **스탠다드**: 보너스 20c 추가 지급 → 160c = 2장 딱 맞음.
> **프리미엄**: 보너스 60c 추가 지급 → 340c = 4장(320c) + 잔여 20c = 풀샷 원본 1회 무료.

### 현재 CHARGE_OPTIONS
```javascript
// 5개 옵션 (제거)
{ label: '📸 다운로드 1장', amount: 10150, credits: 70 }
{ label: '10c', amount: 1450, credits: 10 }
{ label: '100c', amount: 13050, credits: 100 }
{ label: '300c', amount: 34800, credits: 300 }
{ label: '500c', amount: 50750, credits: 500 }
```

### 신규 CHARGE_OPTIONS
```javascript
const CHARGE_OPTIONS = [
  {
    label: '증명사진 1장',
    amount: 9900,
    credits: 70,          // 구매 크레딧 (가입보너스 10c와 합산 → 80c = 1장)
    desc: '생성 + 다운로드 1회',
    recommended: true,
  },
  {
    label: '증명사진 2장',
    amount: 18900,
    credits: 160,          // 140c 구매 + 20c 보너스 = 160c (2장)
    bonus: 20,
    originalAmount: 20300, // 취소선 정가
    desc: '보너스 20c 포함',
  },
  {
    label: '증명사진 4장 + 풀샷',
    amount: 34900,
    credits: 340,          // 280c 구매 + 60c 보너스 = 340c (4장 + 풀샷 원본 1회)
    bonus: 60,
    originalAmount: 40600, // 취소선 정가
    desc: '보너스 60c + 풀샷 원본 1회 무료',
    best: true,
  },
];
```

> **핵심**: `credits` 필드는 **보너스 포함 총 지급량**. 서버 결제 확인 시 이 값으로 크레딧 지급.

### UI 변경

**① 패키지 3개 — 유저 화면 라벨**
- 기본: `증명사진 1장` + 추천 배지
- 스탠다드: `증명사진 2장` + 취소선 ₩20,300 + 실 결제 ₩18,900 + `보너스 +20c`
- 프리미엄: `증명사진 4장 + 풀샷` + 취소선 ₩40,600 + 실 결제 ₩34,900 + `보너스 +60c` + ★BEST 배지

**② 취소선 가격 + 보너스 표시 예시**
```html
<!-- 스탠다드 -->
<span style="text-decoration:line-through;color:#666;font-size:0.75rem;">₩20,300</span>
<span style="color:#a78bfa;font-weight:600;">₩18,900</span>
<span style="color:#34d399;font-size:0.72rem;">+20c 보너스</span>

<!-- 프리미엄 ★BEST -->
<span style="position:absolute;top:-8px;right:12px;background:#f59e0b;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:8px;">★ BEST</span>
<span style="text-decoration:line-through;color:#666;font-size:0.75rem;">₩40,600</span>
<span style="color:#a78bfa;font-weight:600;">₩34,900</span>
<span style="color:#34d399;font-size:0.72rem;">+60c 보너스 · 풀샷 원본 1회 무료</span>
```

**③ 기존 10c/100c/300c/500c 라벨 전부 제거**

### _buildModal() 수정
- `label[data-ci]` 4~5개 → 3개로 축소
- 라디오 버튼 3개 (0=기본, 1=스탠다드, 2=프리미엄)
- 프리미엄에 ★BEST 배지 (금색, `#f59e0b`)
- 패키지 구분선 텍스트: `── 패키지 충전 ──`

---

## 작업 4: result.js — 다운로드 플로우 간소화

### 현재 downloadResult() (라인 331~355)
```javascript
// 비로그인 → GateModule.show() (Phase1/2 팝업)
// 로그인 + 잔액 부족 → ChargeModule.show()
// 로그인 + 잔액 충분 → doDownload()
```

### 신규 downloadResult()
```javascript
async function downloadResult() {
  if (!store.generated) return;

  // 토스 리다이렉트 대비: 원본 임시 보관
  if (_fullOriginal) {
    try { sessionStorage.setItem('_mo_p', _fullOriginal); } catch(e) {}
  }

  // 비로그인 → 직결제 (₩9,900)
  if (!store.user.id) {
    GateModule.buyDirect();
    return;
  }

  // 잔액 부족 → 충전 모달
  if (store.user.credits < CREDIT_COST.download) {
    sessionStorage.setItem('monkos_pending_action', 'download');
    ChargeModule.show();
    return;
  }

  doDownload();
}
```

### 핵심 변경
- `GateModule.show({ onComplete })` → `GateModule.buyDirect()` 로 교체
- 비로그인 사용자: 로그인 유도 없이 바로 토스 직결제 (₩9,900)
- 로그인 사용자: 기존과 동일 (크레딧 차감 or 충전 모달)

### gate.js _proceedAfterGate() 제거
- 라인 560~570: GateModule 70c 달성 후 다운로드 진행 로직 → 더 이상 불필요 (제거)

---

## 작업 5: 포스트 다운로드 영역 정리 (result.js cropAndShowPostDownload)

### 현재 순서 (라인 446~453)
```
① 풀 원본 다운로드 (20c)
② MissionModule.mount() ← 제거 대상
③ ChargeModule.mountInline()
④ PremiumModule.mount()
```

### 신규 순서
```
① 풀 원본 다운로드 (20c) — 유지
② SNS 공유 이벤트 (100c) — 신규 (간소화)
③ ChargeModule.mountInline() — 유지
④ PremiumModule.mount() — 유지
```

### SNS 이벤트 UI (mission.js 대체)
MissionModule.mount() 호출 대신, 인라인 HTML로 간소화:

```javascript
// ② SNS 공유 이벤트 (100c) — 텔레그램 공유만
if (store.user.id) {
  const eventDiv = document.createElement('div');
  eventDiv.style.cssText = 'margin-bottom:12px;';
  eventDiv.innerHTML = `
    <div style="padding:16px;background:linear-gradient(135deg,rgba(167,139,250,0.08),rgba(124,58,237,0.06));border:1.5px solid rgba(167,139,250,0.2);border-radius:14px;">
      <div style="font-size:15px;font-weight:700;color:#c4b5fd;margin-bottom:8px;">🎁 SNS 공유 이벤트</div>
      <div style="font-size:13px;color:#8892a8;line-height:1.6;margin-bottom:14px;">
        결과물을 SNS에 공유하고 <strong style="color:#a78bfa;">100c 받기!</strong>
      </div>
      <button id="btn-sns-event" style="width:100%;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">
        📱 텔레그램으로 공유하고 100c 받기
      </button>
    </div>
  `;
  eventDiv.querySelector('#btn-sns-event').addEventListener('click', async () => {
    // 기존 /api/credits/event 엔드포인트 활용
    try {
      const res = await fetch(`${API.PORTAL_URL}/api/credits/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: store.user.id, eventType: 'sns_share' }),
      });
      const data = await res.json();
      if (data.success) {
        store.user = { ...store.user, credits: data.credits ?? store.user.credits };
        showThankYou('+100 Cr', 'SNS 공유 이벤트 완료');
        eventDiv.querySelector('#btn-sns-event').disabled = true;
        eventDiv.querySelector('#btn-sns-event').textContent = '✅ 이벤트 완료';
      } else {
        alert(data.error || '이미 참여한 이벤트입니다.');
      }
    } catch (err) {
      alert('이벤트 처리 중 오류가 발생했습니다.');
    }
  });
  mount.appendChild(eventDiv);
}
```

> **주의**: 이벤트 백엔드(events.js)에 `sns_share` eventType 처리가 필요할 수 있음. 기존 eventType 맵에 없으면 추가 필요. 단, events.js는 P2 제거 예정이었으므로 — 현재 events.js의 eventType 맵을 확인하고 `sns_share`가 없으면 추가할 것.

---

## 검증

### 배포 전
1. gate.js: `GateModule.show()` 호출 시 에러 없이 무시되는지 (deprecated)
2. gate.js: `GateModule.buyDirect()` → 토스 결제창 ₩9,900 정상 오픈
3. gate.js: `GateModule.showLoginRequired()` → 로그인 모달 정상 동작 (Google/Kakao/LINE)
4. mission.js: import 에러 없는지 (빈 export 하위호환)
5. charge.js: 3개 패키지 정상 표시 (70c/160c/340c), 취소선 가격 + 보너스 표시 + ★BEST 배지
6. result.js: 비로그인 다운로드 → 토스 직결제 (₩9,900)
7. result.js: 로그인 + 잔액 충분 → 크레딧 차감 다운로드
8. result.js: 로그인 + 잔액 부족 → 충전 모달 (3개 패키지: 1장/2장/4장+풀샷)
9. 포스트 다운로드: SNS 이벤트 버튼 표시 + 충전 인라인 + 프리미엄

### 배포 후
1. 비로그인 사용자 E2E: 생성(무료 1회) → 프리뷰 → 다운로드(₩9,900 직결제) → 포스트 다운로드
2. 로그인 사용자 E2E: 생성(10c) → 프리뷰 → 다운로드(70c) → 포스트 다운로드 → SNS 이벤트(100c)
3. 충전 플로우: 잔액 부족 → 충전 모달 → 토스 결제 → 잔액 갱신

---

## 산출물

- 수정 파일 목록 + diff
- mission.js deprecated 처리 확인
- charge.js 패키지 스크린샷 또는 UI 확인
- 배포 리비전 (또는 GCS/CF 업로드 확인)
- SNS 이벤트 백엔드 eventType 추가 여부 보고

---

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: 기존 사용자 크레딧·결제 데이터 변경 금지
- **헌법 제8조 (파괴적 명령 금지)**: mission.js는 빈 export로 보존 (파일 삭제 ❌)
- **헌법 제10조 (프록시 금지)**: gate.js Phase1/2는 우회가 아닌 근원 제거
- **헌법 제2조 (완료 보고)**: `✅❌💡⏳📁🔀` 형식 보고

---

**[2026-03-01 16:03 KST] iMac/쌍아 발행 (v2 — 패키지 보너스 크레딧 반영)**
