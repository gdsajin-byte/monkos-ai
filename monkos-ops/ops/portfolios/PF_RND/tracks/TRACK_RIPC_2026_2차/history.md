---
type: track-history
track: TRACK_RIPC_2026_2차
pf: PF_RND
subject: 경기지식재산센터(RIPC) 하남시 지식재산 긴급지원 2차
created: 2026-04-24
deadline: 2026-05-11 18:00
status: 진행 중
---

# TRACK RIPC 2026 2차 — 히스토리

> **append only. 수정·삭제 금지.**

## 사업 개요

- **사업명**: 2026년 하남시 지식재산 긴급지원 사업 (2차)
- **주관**: 경기지식재산센터 (RIPC)
- **마감**: 2026-05-11 18:00
- **지원 유형**: IP (국내 특허 출원 + PCT 해외 출원)
- **대상 기술**: MONKOS Crop — 브라우저 기반 ICAO 규격 자동 크롭 (PF_CROP)

## 민아 세션 산출물 (2026-04-24)

| 파일 | 경로 | 성격 |
|------|------|------|
| 전화 문의 체크리스트 | `ops/drafts/QA_20260424_RIPC_하남IP긴급지원_문의리스트.md` | 통화 기록 |
| 양식 마크다운 변환본 | `ops/drafts/FORMS_20260424_RIPC_하남IP긴급지원_양식마크다운.md` | 구조 참조 |
| 신청 A 초안 (국내 특허) | `ops/drafts/SUBMIT_20260424_RIPC_A_국내특허_양식초안.md` | 제출용 초안 |
| 신청 B 초안 (PCT 해외) | `ops/drafts/SUBMIT_20260424_RIPC_B_PCT해외_양식초안.md` | 제출용 초안 |
| 변리사 PCT 견적 요청 이메일 | `ops/drafts/EMAIL_20260424_변리사_PCT견적요청.md` | 대외 통신 |

## Google Docs 3건

- [02 신청서 (공통)](https://docs.google.com/document/d/11CtZLWlD9BF7X3QSrXdB3TH9N7jkNdu5XtqBGakV4eI/edit)
- [03 양식-7 국내출원 (신청 A)](https://docs.google.com/document/d/1T95JR1K1BfQRBbTlhCp9h03t1uh578xQ3TP5-qLIwDM/edit)
- [03 양식-8 PCT 해외 (신청 B)](https://docs.google.com/document/d/1Db9u54sCFM90U5nO6t-IsY2w7ac8qew5LS0m1wHkURU/edit)

## 현재 상태 (2026-04-24)

| 항목 | 상태 |
|------|------|
| 신청서 A·B 초안 | ✅ 완성 |
| 변리사 PCT 견적 요청 | ⏳ 이메일 초안 완료, 발송 대기 |
| 변리사 견적 수신 | ⏳ 4/28 회신 희망 |
| 작가님 기재란 정보 | ⏳ 사업자번호·주소·매출·고용·IRIS 등 |
| 중소기업확인서 발급 | ⏳ sminfo.mss.go.kr |
| RIPC PMS 회원가입 | ⏳ pms.ripc.org + 공동인증서 |
| 회사소개서 2p | ⏳ 민아 Google Docs |
| 크롭앱 스크린샷 4~6장 | ⏳ 도면용 |
| 신청 A 최종 제출 | ⏳ PMS 업로드 |
| 신청 B 최종 제출 | ⏳ PMS 업로드 (별도 접수) |

## 주 담당

- 서류 작성: 민아
- 공동인증서 제출·변리사 커뮤니케이션: 작가님
- 선정 후 협력기관 관리: 쌍아 보조

## 관련 기술 문서 (PF_CROP)

- 크롭앱 특허 기술설명서: `monkos-ops/tech/rnd/PATENT_20260323_크롭앱_기술설명서_변리사용.md`
- 정수리알고리즘 개발 히스토리: `monkos-ops/tech/rnd/PATENT_20260323_정수리알고리즘_개발히스토리.md`

## 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 04/24 | 민아 | RIPC 공고 분석 + 양식 해독 + 신청서 A·B 초안 + 변리사 이메일 | 위 산출물 전체 | ✅ |
| 04/24 | 민아 | PF_RND 신설 제안 | 제안서 | ✅ |
| 04/24 | 막내2 | PF_RND 트랙 초기화 | 본 문서 | ✅ |
| 05/06 | 쌍아 | 02 신청서 HWPX 완성 (python-hwpx 자동 채우기) | `~/Desktop/지식산업/hwpx/02_신청서_몽크사진관.hwpx` | ✅ |
| 05/06 | 쌍아 | 재무제표 3개년 통합 PDF 생성 | `~/Desktop/지식산업/표준재무제표_몽크사진관_2022-2024_통합.pdf` | ✅ |
| 05/06 | 쌍아 | 03 계획서 DOCX 초안 작성 (양식-7 + 양식-8) | `~/Desktop/지식산업/03_양식7_*.docx`, `03_양식8_*.docx` | ⏳ 내용 교정 필요 |
| 05/06 | 작가님 | 03 계획서 방향 수정 지시 — 기술 명칭 제거, PF_CROP 기반 재구성, 크롭앱 실물 확인하며 작업 | — | ⏳ |
| 05/06 | 쌍아 | HWPX 파이프라인 확립 (4060→python-hwpx→뷰어PDF) | PF_DOCS 기록 | ✅ |

## 05/06 이후 작업 방향 (작가님 확정)

03 계획서를 크롭앱 실물 + PF_CROP 기술 포인트 기반으로 며칠에 걸쳐 재작성.

**기술 3축 (PF_CROP에서 추출)**
1. 정수리 자동 측정 + QC 보정: 해부학 비례 기반 자동 산출 → 사용자 드래그 미세 보정
2. 규격 완전 대응: 4패턴(A/B/C/D)으로 전 세계 커버. 데이터 추가만으로 확장
3. 서버리스: 얼굴 사진 서버 전송 0. 분석~출력 전 과정 사용자 기기 완결

**사업화 (간결)**
- 크롭앱 단독 서비스 (무료, Google Play/App Store 등록 예정)
- AI 증명사진 생성 시스템과 협업 구성 (크롭 엔진으로 내장)
- 이미 웹 서비스(monkos.ai/crop) 운영 중

**금지 — 계획서에 넣지 않을 것**
- 내부 기술 명칭 (MediaPipe, FaceMesh, Canvas API, ISNet 등)
- 듣도보도 못한 경쟁사 나열
- 일본 매출 반복
