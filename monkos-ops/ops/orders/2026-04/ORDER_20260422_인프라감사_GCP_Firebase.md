---
type: ORDER
date: 2026-04-22
from: iMac/쌍아
to: iMac/막내1
status: 대기
---

# [지시서] GCP + Firebase 인프라 총체 감사

> **[2026-04-22 11:00 KST] iMac/쌍아 → iMac/막내1**
> 목적: GCP 전체 프로젝트의 리소스·인증·보안 현황을 총체 파악하여 감사 보고서 산출

---

## 1. 감사 범위

### 1-1. GCP 프로젝트 전체 목록 및 관계도
```bash
gcloud projects list
```
- 각 프로젝트의 **용도, 활성/유휴 판별, 상호 관계** 정리
- 프로젝트명과 실제 용도의 개연성 확인 (예: "MONKOS IMAGE pro" 동의화면이 Docs에 뜨는 류의 혼선)

### 1-2. 서비스 계정 (SA)
```bash
# 전 프로젝트 순회
for proj in $(gcloud projects list --format="value(projectId)"); do
  echo "=== $proj ==="
  gcloud iam service-accounts list --project=$proj
done
```
- 각 SA의 **용도, 활성/비활성, 키 존재 여부**
- 불필요 SA 식별
- ⚠️ 키 삭제/SA 삭제는 하지 말 것. 보고만.

### 1-3. OAuth 클라이언트 & 동의 화면
- 각 프로젝트별 OAuth 2.0 클라이언트 목록
- 동의 화면(Consent Screen) 설정명 — 프로젝트별 1개
- 클라이언트별 용도 추정 (redirect URI 기반)
- 테스트 사용자 목록 확인

### 1-4. API 키
```bash
for proj in $(gcloud projects list --format="value(projectId)"); do
  echo "=== $proj ==="
  gcloud services api-keys list --project=$proj 2>/dev/null
done
```
- 각 키의 **용도, 제한사항(IP/리퍼러/API), 활성 여부**

### 1-5. 활성화된 API/서비스
```bash
for proj in $(gcloud projects list --format="value(projectId)"); do
  echo "=== $proj ==="
  gcloud services list --enabled --project=$proj
done
```
- 유휴 API 식별 (활성인데 실제 사용 안 하는 것)

### 1-6. Cloud Storage 버킷
```bash
gsutil ls
# 각 버킷별
gsutil ls -L -b gs://버킷명
```
- 버킷별 **용도, 접근 권한(public/private), 크기, 최종 수정일**
- CORS 설정 확인
- 유휴 버킷 식별

### 1-7. Cloud Run 서비스
```bash
gcloud run services list
```
- 서비스별 **URL, 리전, 최근 배포일, 트래픽 현황**
- deploy.sh 존재 여부 대조 (법률 ch5 2조)

### 1-8. Secret Manager
```bash
for proj in $(gcloud projects list --format="value(projectId)"); do
  echo "=== $proj ==="
  gcloud secrets list --project=$proj 2>/dev/null
done
```
- 시크릿별 **용도 추정, 최종 갱신일, 버전 수**
- ⚠️ 값 조회 금지. 목록과 메타데이터만.

### 1-9. Firebase
```bash
# Firebase 프로젝트 목록
firebase projects:list 2>/dev/null || echo "firebase CLI 없으면 gcloud로 대체"
```
- Firestore 데이터베이스 존재 여부 및 컬렉션 구조 (최상위만)
- Firebase Auth 설정 (활성 프로바이더)
- Firebase Hosting 사이트
- Firestore 보안 규칙 현황

### 1-10. IAM 주요 바인딩
```bash
for proj in $(gcloud projects list --format="value(projectId)"); do
  echo "=== $proj ==="
  gcloud projects get-iam-policy $proj --format="table(bindings.role, bindings.members)" 2>/dev/null
done
```
- 과도한 권한 부여 식별 (owner가 너무 많은 등)

---

## 2. 산출물

**보고서 파일**: `monkos-ops/ops/reports/REPORT_20260422_GCP_Firebase_인프라감사.md`

### 보고서 구조
```markdown
# GCP + Firebase 인프라 감사 보고서
> [2026-04-22] iMac/막내1

## 1. 프로젝트 관계도 (표)
## 2. 서비스 계정 현황 (프로젝트별 표)
## 3. OAuth/API 키 현황
## 4. 버킷 현황
## 5. Cloud Run 현황
## 6. Secret Manager 현황
## 7. Firebase 현황
## 8. 위험/개선 발견사항 (⚠️ 표시)
## 9. 유휴 리소스 목록
```

---

## 3. 준수 조항

⚠️ **헌법 4조 1항**: API 키·시크릿 값 절대 생성/추측/노출 금지. 목록과 메타데이터만 조회
⚠️ **헌법 4조 2항**: 삭제·수정 명령 실행 금지. 읽기 전용 감사
⚠️ **피드백**: 진단 1순위 = 실제 리소스 직접 조회 (`gcloud`/`gsutil` 명령 우선, 코드 추론 금지)

---

## 4. 완료 기준

- 보고서 파일 작성 완료
- 전 프로젝트 순회 완료 (누락 프로젝트 없을 것)
- 위험/개선 사항 별도 섹션으로 분리
- 세션 로그 어펜드
