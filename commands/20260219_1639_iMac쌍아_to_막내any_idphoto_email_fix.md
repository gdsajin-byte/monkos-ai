# 지시서: idphoto-kr/jp 법적페이지 이메일 교체

[2026-02-19 16:39 KST] iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → iMac/쌍아` 형식

## 0원칙 예외 선언
> 이 작업은 **법적 표기 정정**이므로 프로덕션 동결(0원칙)의 예외입니다.
> HTML 법적페이지의 이메일 주소만 교체합니다. server.js/index.html 등 로직 코드는 수정 금지.

---

## 작업 내용

`gdsajin@gmail.com` → `info@monkos.ai` 일괄 교체 (6파일 11건)

### idphoto-kr (3파일 7건)

| 파일 | 라인 | 내용 |
|------|------|------|
| `monkos_AI/idphoto-kr/public/privacy.html` | L80 | 회원 탈퇴 이메일 |
| `monkos_AI/idphoto-kr/public/privacy.html` | L86 | 연락처 이메일 |
| `monkos_AI/idphoto-kr/public/refund.html` | L62 | 환불 요청 이메일 |
| `monkos_AI/idphoto-kr/public/refund.html` | L77 | 연락처 이메일 |
| `monkos_AI/idphoto-kr/public/terms.html` | L51 | 탈퇴 요청 이메일 |
| `monkos_AI/idphoto-kr/public/terms.html` | L106 | 연락처 이메일 |

### idphoto-jp (3파일 5건)

| 파일 | 라인 | 내용 |
|------|------|------|
| `monkos_AI/idphoto-jp/public/privacy.html` | L80 | 退会 연락처 |
| `monkos_AI/idphoto-jp/public/privacy.html` | L86 | メール 연락처 |
| `monkos_AI/idphoto-jp/public/tokusho.html` | L44 | メールアドレス |
| `monkos_AI/idphoto-jp/public/tokusho.html` | L59 | 返金 연락처 |
| `monkos_AI/idphoto-jp/public/terms.html` | L51 | 退会 연락처 |

### 실행 방법

```bash
# 한 줄로 전부 교체 가능
cd /Users/jeong-kyushin/developer/monk_project

# KR
sed -i '' 's/gdsajin@gmail.com/info@monkos.ai/g' \
  monkos_AI/idphoto-kr/public/privacy.html \
  monkos_AI/idphoto-kr/public/refund.html \
  monkos_AI/idphoto-kr/public/terms.html

# JP
sed -i '' 's/gdsajin@gmail.com/info@monkos.ai/g' \
  monkos_AI/idphoto-jp/public/privacy.html \
  monkos_AI/idphoto-jp/public/tokusho.html \
  monkos_AI/idphoto-jp/public/terms.html
```

### 검증

```bash
# 잔여 확인 (0건이어야 함)
grep -r "gdsajin" monkos_AI/idphoto-kr/public/ monkos_AI/idphoto-jp/public/

# 교체 확인
grep -r "info@monkos.ai" monkos_AI/idphoto-kr/public/ monkos_AI/idphoto-jp/public/
```

### 커밋

```bash
git add monkos_AI/idphoto-kr/public/privacy.html \
        monkos_AI/idphoto-kr/public/refund.html \
        monkos_AI/idphoto-kr/public/terms.html \
        monkos_AI/idphoto-jp/public/privacy.html \
        monkos_AI/idphoto-jp/public/tokusho.html \
        monkos_AI/idphoto-jp/public/terms.html

git commit -m "[fix] idphoto-kr/jp 법적페이지 이메일 info@monkos.ai 통일"
git push origin develop
```

### 배포
- **배포하지 않는다.** 커밋+push까지만.
- 배포는 작가님/쌍아가 별도 판단 (프로덕션 동결 범위)

---

## 주의사항
- server.js, index.html 등 로직 파일 수정 금지
- HTML 법적페이지 6파일만 대상
- 전화번호 관련 수정은 이번 범위 밖 (이미 portal에서 삭제됨, idphoto는 별도)
