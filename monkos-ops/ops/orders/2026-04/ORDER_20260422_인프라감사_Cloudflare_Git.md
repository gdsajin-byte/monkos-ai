---
type: ORDER
date: 2026-04-22
from: iMac/쌍아
to: iMac/막내2
status: 대기
---

# [지시서] Cloudflare + Git 인프라 총체 감사

> **[2026-04-22 11:00 KST] iMac/쌍아 → iMac/막내2**
> 목적: Cloudflare 전체 리소스 + Git 레포/인증 현황을 총체 파악하여 감사 보고서 산출

---

## 1. 감사 범위

### 1-1. Cloudflare 계정 & 존(Zone)
- MCP 도구 활용 가능: `mcp__cloudflare__zones_list`
- 존별 **도메인, 플랜, 상태**
- DNS 레코드 현황 (주요 도메인: monk.kr, monkos.ai)

### 1-2. Cloudflare Pages
- 프로젝트 목록, 각 프로젝트의 **커스텀 도메인, 빌드 소스, 최근 배포일**
- 활성/유휴 판별

### 1-3. Cloudflare Workers
```
mcp__cloudflare__worker_list
```
- 워커별 **용도, 라우트 바인딩, 최근 수정일**
- 활성/유휴 판별
- 환경변수·시크릿 목록 (값 X, 키 이름만)

### 1-4. Cloudflare D1 데이터베이스
```
mcp__cloudflare__d1_list_databases
```
- DB별 **용도, 테이블 목록, 행 수 추정, 최종 수정일**
- 유휴 DB 식별

### 1-5. Cloudflare KV
```
mcp__cloudflare__get_kvs
```
- 네임스페이스별 **용도, 키 수, 최근 사용**

### 1-6. Cloudflare R2
```
mcp__cloudflare__r2_list_buckets
```
- 버킷별 **용도, 크기 추정, 접근 설정**

### 1-7. Cloudflare Cron Triggers
```
mcp__cloudflare__cron_list
```
- 등록된 크론 작업과 대상 워커

### 1-8. Git 레포지토리 현황
```bash
# GitHub 레포 목록
gh repo list gdsajin-byte --limit 50
```
- 레포별 **용도, public/private, 최근 활동, 연결된 서비스**
- 본진(`monk_project`)과의 관계 (submodule, subtree, 독립)

### 1-9. Git 인증 & 배포 키
```bash
# GitHub SSH 키
gh ssh-key list
# Deploy keys (레포별)
gh api repos/gdsajin-byte/monk-project/keys 2>/dev/null
```
- SSH 키 / deploy 키 현황
- 불필요 키 식별

### 1-10. 도메인 매핑 전체도
- `monk.kr` → 어디로 (CF Pages? redirect?)
- `monkos.ai` → 어디로 (Cloud Run? CF?)
- 서브도메인별 매핑 (idphoto-kr, idphoto-jp, pt 등)
- 커스텀 도메인 ↔ 서비스 연결 크로스체크

---

## 2. 산출물

**보고서 파일**: `monkos-ops/ops/reports/REPORT_20260422_Cloudflare_Git_인프라감사.md`

### 보고서 구조
```markdown
# Cloudflare + Git 인프라 감사 보고서
> [2026-04-22] iMac/막내2

## 1. 도메인 → 서비스 매핑 전체도
## 2. Cloudflare Pages 현황 (표)
## 3. Cloudflare Workers 현황 (표)
## 4. D1 / KV / R2 스토리지 현황
## 5. Cron Triggers
## 6. Git 레포 현황 (표)
## 7. Git 인증 키 현황
## 8. 위험/개선 발견사항 (⚠️ 표시)
## 9. 유휴 리소스 목록
```

---

## 3. 준수 조항

⚠️ **헌법 4조 1항**: 시크릿 값 노출 금지. 키 이름·메타데이터만 조회
⚠️ **헌법 4조 2항**: 삭제·수정 명령 실행 금지. 읽기 전용 감사
⚠️ **CDP 규칙**: Cloudflare MCP 도구 사용 가능 (read-only 작업에 한함)

---

## 4. 완료 기준

- 보고서 파일 작성 완료
- 도메인 매핑 전체도 크로스체크 완료
- 위험/개선 사항 별도 섹션으로 분리
- 세션 로그 어펜드
