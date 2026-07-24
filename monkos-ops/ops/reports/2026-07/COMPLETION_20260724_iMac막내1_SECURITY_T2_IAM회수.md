---
type: completion
date: 2026-07-24
device: iMac
agent: 막내1
status: 마감
portfolio: PF_SECURITY
---

# COMPLETION — SECURITY T2: IAM 과권한 회수 + SM 잔재 정리

**[2026-07-24 11:33 KST]** iMac/막내1 → 작가님

> 지시서: `ORDER_20260724_iMac쌍아_막내_SECURITY_T2_IAM회수.md`
> 근거: 민아 SA·키·시크릿 종합감사 T2 항목

## 결과

### ✅ Task 1: N8N_API_KEY SM 컨테이너 삭제
- `gcloud secrets delete N8N_API_KEY --project=monkos` 실행
- 검증: `secret map N8N_API_KEY` → "SM에 없음" 확인
- SECRET_INVENTORY.md #30행 → 🗑️ 폐기(삭제) 마킹

### ✅ Task 2: compute 기본 SA roles/editor 회수
- 실측: `933456016842-compute@developer.gserviceaccount.com`에 roles/editor 존재 확인
- `gcloud projects remove-iam-policy-binding` 실행
- 검증: 프로젝트 레벨 역할 0행 (완전 무권한)
- SECRET_INVENTORY.md §G 테이블 + 권한 매트릭스 갱신

### ✅ Task 3: monk-image-engine 프로젝트 레벨 tokenCreator 축소
- 실측: 프로젝트 레벨 tokenCreator 존재 + gdsajin 임퍼소네이션 = SA 레벨 확인 (영향 없음)
- 프로젝트 레벨 회수 → SA 레벨 자기서명 재부여
- SA 레벨 바인딩 검증: monk-image-engine(자기서명) + gdsajin(임퍼소네이션) 2건 정상
- 스모크: Cloud Run 에러 로그 0건 (5분) + gsc_submit.sh list 정상
- SECRET_INVENTORY.md §G 테이블 + 권한 매트릭스 갱신

### ⏳ Task 4: yong-a 키 90일 로테이션
- 별도 지시서 대기 (디바이스 MCP 캐시 전파 검증 설계 선행 필요)

## 💡 참고
- tokenCreator 축소로 monk-image-engine SA 침해 시에도 **타 SA 임퍼소네이션 불가** (자기 서명만 가능)
- compute default SA는 이제 프로젝트 내 아무 권한 없음 — 신규 리소스가 기본 SA로 부착되어도 무해

## 📁 변경 파일
- `monkos-ops/ops/SECRET_INVENTORY.md` — §A #30행 폐기 마킹, §G compute SA 갱신, §G monk-image-engine 갱신, 권한 매트릭스 3건 갱신
- `monkos-ops/ops/portfolios/PF_SECURITY/README.md` — 히스토리 1행 어펜드
- `monkos-ops/ops/sessions/2026-07/2026-07-24_iMac_막내1.md` — 세션 로그

## IAM 변경 diff

| 주체 | Before | After |
|------|--------|-------|
| N8N_API_KEY (SM) | 컨테이너 존재 (버전 destroyed) | **삭제** |
| compute default SA | roles/editor | **역할 0** |
| monk-image-engine | tokenCreator(프로젝트) | **tokenCreator(SA 레벨, 자기서명 전용)** |
| gdsajin → image-engine | SA 레벨 tokenCreator | SA 레벨 tokenCreator (변경 없음) |
