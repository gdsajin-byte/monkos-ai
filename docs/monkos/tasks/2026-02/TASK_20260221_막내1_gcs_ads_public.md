# 지시서: GCS ads/ 폴더 공개 접근 설정

```
[2026-02-21 18:26 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **네 수정 범위**: GCS 버킷 권한 설정만

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | GCS ads/ 폴더 공개 접근 설정 |
| **수정 대상** | `gs://monk-ai-images/ads/` 객체 ACL |
| **브랜치** | 코드 수정 없음 |
| **긴급도** | 높음 (프로덕션 광고 이미지 미노출 중) |

## ⚠️ 준수 조항

- **헌법 제6조**: 인프라 보호 — API 키/시크릿 절대 생성/추측 금지
- **헌법 제8조**: 파괴적 명령 금지

## 배경

result.js에서 브라우저가 GCS 광고 이미지를 직접 fetch하는데, 버킷에 `allUsers` 공개 읽기 권한이 없어 403 발생. manifest.json만 개별 공개 설정되어 있고 이미지는 비공개 상태.

서비스 계정(`monk-image-engine@monkos.iam.gserviceaccount.com`)은 서버 사이드 전용이라 브라우저 직접 접근에는 쓸 수 없음. 광고 이미지는 공개 목적 콘텐츠이므로 ads/ 폴더만 공개 설정.

---

## 작업 내역

### TASK 1: ads/ 폴더 전체 객체에 공개 읽기 권한 부여

```bash
gsutil -m acl ch -r -u AllUsers:R gs://monk-ai-images/ads/
```

### TASK 2: 접근 확인

아래 URL들이 200 응답을 반환하는지 curl로 확인:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://storage.googleapis.com/monk-ai-images/ads/manifest.json"
curl -s -o /dev/null -w "%{http_code}" "https://storage.googleapis.com/monk-ai-images/ads/1771578266121_0.jpg"
```

둘 다 `200`이면 성공.

---

## 금지 사항

- 버킷 전체(`gs://monk-ai-images/`)에 공개 권한 부여 금지 — **ads/ 폴더만**
- 버킷 IAM 정책 변경 금지 — 객체 ACL만 수정
- 코드 수정 금지
- 서비스 계정 키 생성/수정 금지

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | ads/ 객체 ACL 공개 설정 | **필수** |
| 2 | curl로 200 응답 확인 | **필수** |
| 3 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |
| 4 | 코드 커밋 | **불필요** (코드 수정 없음) |

---

## 완료 조건

1. `gs://monk-ai-images/ads/` 하위 모든 이미지가 public URL로 접근 가능 (HTTP 200)
2. `gs://monk-ai-images/` 루트 및 다른 폴더는 기존 권한 유지
3. 완료 보고 발신
