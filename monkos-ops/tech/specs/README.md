# specs — 서비스별 기술 명세

docs/infrastructure/에서 핵심을 추출하여 서비스별로 체계화한 운영 스펙.

## 서비스별 폴더

| 폴더 | 서비스 |
|------|--------|
| portal/ | monkos.ai 포털 |
| idphoto-kr/ | 한국 AI 증명사진 |
| idphoto-jp/ | 일본 AI 증명사진 |
| photolab/ | monk.kr 프로덕션 포토랩 |
| ai-models/ | AI 모델 명세 (코칭/QC/Imagen) |
| infrastructure/ | 인프라 공통 (GCS/배포/인증) |

## 카탈로그 (docs/infrastructure/ 인덱스)

| 문서 | 대상 | 건수 |
|------|------|------|
| [architecture_catalog.md](architecture_catalog.md) | 시스템 아키텍처 + 코드 공유 설계 | 6건 |
| [feature_specs_catalog.md](feature_specs_catalog.md) | 기능 스펙 + BWYA 스키마 | 7건 |

원본은 `docs/infrastructure/`에 유지. 카탈로그는 인덱스+요약만 제공.
