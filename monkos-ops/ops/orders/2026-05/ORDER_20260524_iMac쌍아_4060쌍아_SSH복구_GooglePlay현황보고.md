---
type: order
date: 2026-05-24
from: iMac/쌍아
to: 4060/쌍아
subject: SSH 공개키 복구 + Google Play IDPASS 현황 보고
status: 대기
portfolio: PF_CROP
---

# 지시서: SSH 공개키 복구 + Google Play IDPASS 현황 보고

**[2026-05-24 13:12 KST] iMac/쌍아 → 4060/쌍아**

---

## 1. SSH 공개키 등록 (즉시)

iMac → 4060 SSH 인증이 실패하고 있다. iMac 공개키를 authorized_keys에 추가할 것.

```bash
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

등록 후 확인:
```bash
grep "monk.kr" ~/.ssh/authorized_keys
```

---

## 2. Google Play IDPASS Android 현황 보고

현재 Google Play Console에서 스토어 등록정보 작성 중이다. 4060에서 진행한 Android 앱의 아래 사항을 보고할 것:

### 2-1. 빌드 상태
- 최신 빌드 성공 여부
- 서명키(keystore) 생성 여부 — Google Play 업로드용 release keystore 존재 여부
- release APK/AAB 생성 가능 여부

### 2-2. 기능 완성도
- 각 Step(1~5 + Thanks) 화면별 동작 상태
- 5/23 작가님 피드백 (용도→국가 중복 선택 개선) 반영 여부
- Landing 데모 애니메이션 (PhoneDemoView) 구현 여부

### 2-3. 잔여 이슈
- 알려진 버그 또는 미구현 기능 목록
- Google Play 출시 전 필수 작업 목록

---

## ⚠️ 준수 조항
- 헌법 3조 1항: 타임스탬프 `date` 실측 필수
- 보고 형식: ✅❌💡⏳📁🔀

---

## 산출물
1. SSH 공개키 등록 완료 확인
2. 현황 보고 (본 지시서 내용 기반, COMPLETION 보고서 또는 세션 로그)
3. 커밋 + 푸시
