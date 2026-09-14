---
type: report
date: 2026-09-07
device: iMac
agent: 민아
status: 마감
subject: "monk.kr 몽크사진관 페이지 이미지가 Unsplash 더미로 표시되는 원인"
---

**[2026-09-07 15:11 KST]** iMac/민아 → 작가님

# monk.kr 스튜디오 이미지 더미 폴백 — 원인 보고

## 결론
- 스튜디오 페이지(`/monk_studio/monk_studio`)의 로컬 이미지 7종·가족 페이지 10종이 **라이브 빌드에 존재하지 않는다.** 이미지 경로 요청이 CF Pages SPA 폴백(index.html, 200 text/html)으로 응답 → `<img onerror>`가 Unsplash 폴백 URL로 교체 → "무료 더미"로 보임.
- 이미지가 빌드에 없는 이유: **CF Pages가 GitHub 자동 빌드로 배포 중**이고, 해당 jpg는 `.gitignore` `*.jpg`(01-14 Git 용량 최적화)로 **한 번도 커밋된 적이 없다**(화이트리스트는 `MONK_kr/images/*.jpg`만). git 소스 빌드에는 워킹트리의 미추적 파일이 포함될 수 없다.
- 홈(`/`)의 4개 카드 이미지는 01-10부터 Unsplash 직결 설계(로컬 원본 없음) — 회귀 아님.

## 실측 (2회 히트, live-verify 준수)
| 대상 | 결과 |
|---|---|
| `/monk_studio/images/service_id.jpg` | 200 **text/html** 28,621B (index.html 폴백) ×2 |
| `/monk_studio/family/images/hero.jpg` | 200 **text/html** (동일) |
| `/images/main.jpg` (git 추적, 대조군) | 200 image/jpeg 997,575B |
| `/monk_studio/monk_studio` | 200, onerror→Unsplash 6건, 로컬 파일과 본문 동일 |
| CF 배포 목록 최근 25건 | **전부 GitHub push 트리거**(Production=main, Preview=claude/* 브랜치). 직접 업로드 0건 |
| `wrangler pages project list` | monk-kr Git Provider = **Yes** |

## 규정 불일치 (보고 의무, 헌법 5조 3항)
- 법률 ch5 1조·`.claude/commands/deploy-cf.md` 3단계: **"자동빌드 OFF — Git push = 코드 저장만"**(02-20 결정).
- 실제: 05-14 민아 세션로그에 "CF Pages git 연동 자동 배포 확인 … 자동 빌드 ~7분 지연" 기록, 06-14 쌍아 "CF Pages 빌드 에러 해소". 즉 **늦어도 05-14부터 자동빌드 ON**. 현재는 main 푸시마다(브리핑 자동 커밋 포함, 하루 5~10회) 프로덕션 재배포. 재활성 주체·시점 기록 없음.
- 결과: iMac에서 wrangler 직접 업로드로 이미지를 실어도 **다음 푸시가 이미지 없는 빌드로 덮어쓴다.** 규정과 실제 배포 경로가 어긋난 상태.

## 보류 중인 선택지 (작가님 판정 대기 — 미실행)
1. **(권고) 이미지를 git에 편입** — `.gitignore`에 `!MONK_kr/monk_studio/**/*.jpg` 예외 + 커밋. 단 현재 원본 73MB(service_family.jpg 10MB, family/images 63MB) → 웹용 재압축(webp, 200~300KB/장) 선행 필수. 자동빌드 ON을 정본으로 인정하고 ch5 1조·deploy-cf.md 개정 청구.
2. 자동빌드 OFF 복원(02-20 결정 회귀) + iMac 직접 업로드 유지 — 웹민아·자동 브리핑 푸시가 배포를 안 타게 되므로 monk.kr 반영은 전부 수동. 규정 정합이나 운영 역행.
3. 이미지를 R2/GCS 외부 호스팅으로 이전 — 별도 설계.

## 변경 파일
- 없음 (조사만). 세션 로그: `monkos-ops/ops/sessions/2026-09/2026-09-06_iMac_민아.md`

## 보정 [2026-09-07 15:30 KST] — 작가님 지적 "하부 디렉토리는 이미지 정상"
- 실측(2회 히트): id_photo·profile·standard/premium/deluxe 하위 이미지 = **image/jpeg 정상**. family 8종·group main.jpg·스튜디오 허브 7종 = text/html 폴백.
- 원인 일치: 정상 폴더는 **01-10 커밋으로 git 추적 중**(id_photo 10+15, profile 9). 폴백 폴더는 **미추적**(monk_studio/images 7, family/images 10 — gitignore). git 추적 여부 = 라이브 존재 여부, 1:1 대응.
- 추가 적발: `monk_studio/group/images/`는 **로컬에도 없음** — group 페이지 main.jpg는 배포 경로와 무관한 원본 부재.
- 영향 범위 정정: 스튜디오 허브 + 가족 + 단체 3면. 증명사진·프로필 계열은 무관.
