# 기술명세: 2026-02-20 인프라 변경사항

**작성일**: 2026-02-20
**작성자**: M1/막내1 (지시서: M1/쌍아)

---

## 1. CF Pages 배포 체계 변경

### 변경 전
- GitHub 웹훅 자동빌드 (push → 자동 deploy)
- develop/main 브랜치 push 시 즉시 배포 트리거

### 변경 후
- 자동빌드 OFF, **수동 배포만** (`wrangler pages deploy`)
- 변경 이유: 멀티 에이전트 환경에서 push = 배포 통제 불가

### Production 배포 명령
```bash
cd /tmp && npx wrangler pages deploy /tmp/monk-kr-deploy --project-name monk-kr --branch main --commit-dirty=true
```

### symlink 설정
```bash
ln -sfn "/Users/developer/monk_project/MONK_kr" /tmp/monk-kr-deploy
```

### 환경 매핑
| 옵션 | 환경 | 도메인 |
|------|------|--------|
| `--branch main` | Production | monk.kr |
| 미지정 / 기타 | Preview | *.monk-kr.pages.dev |

---

## 2. photolab MPA 현재 상태

### 페이지 구조 (6페이지)
```
index.html   → 랜딩 (가격표 + 시작 버튼)
prep.html    → 준비실 (스타일·성별·연령 선택)
camera.html  → 촬영실 (카메라 + AI 코칭)
result.html  → 분석실 (사전분석 → 생성 → 결과)
thankyou.html → 수령처 (미리보기 + 저장 + SNS 공유)
options.html → 옵션 (추가 촬영 / 이벤트 / 포털 복귀)
```

### QC 파이프라인 변경
- **제거됨**: QC(품질검증) 단계
- **현재 흐름**: 사전분석 → Imagen 생성 → 바로 결과 표시
- 제거 이유: 79 임계점 — QC가 Cloud Run 리소스 잠식의 주범

### 크레딧 단가
| 항목 | 크레딧 | 원화 |
|------|--------|------|
| 생성 | 1c | ₩1,500 |
| 다운로드 | 8c | ₩12,000 |
| **합계** | **9c** | **₩13,500** |

### 관련 커밋
- `b02930b` — photolab MPA 구조 완성 (랜딩 분리 + QC 제거 + 크레딧 통일)
- `cc628a0` — 랜딩 가격 카드화 + 크레딧 단가 정정

---

## 3. 경로 공백 제거 완료

### 문제
```
/Users/developer/monk_project /   ← 후행 공백 (mv 시점 불명, Finder/자동화 추정)
```

### 해결
```bash
mv "/Users/developer/monk_project " "/Users/developer/monk_project"
```

### 기능성 파일 수정 (하드코딩 경로 포함)
| 파일 | 수정 내용 |
|------|-----------|
| `scripts/sync_visitors_to_gcs.sh` | 경로 공백 제거 |
| `scripts/sync_to_gcs.sh` | 경로 공백 제거 |
| `package-lock.json` | 자동 생성 경로 반영 |

### 사후 조치
- Claude projects dir: 새 경로에서 자연 생성 확인 → 구 dir(`-monk-project-`) 삭제
- symlink `/tmp/monk-kr-deploy`: 새 경로로 재생성
- 관련 커밋: `2fc1afb`, `dd71a75`

---

## 4. CLAUDE.md 체계화 (예정)

### 현재 상태
- 헌법(불변 원칙) / 법률(운용 규칙) / 규정(세부 절차)이 CLAUDE.md 한 파일에 혼재
- 파일 길이 증가로 에이전트 컨텍스트 부담 가중

### 과제
- 3계층 분리: 헌법(CLAUDE.md 핵심) / 법률(별도 파일) / 규정(별도 파일)
- 다음 세션 착수 예정
