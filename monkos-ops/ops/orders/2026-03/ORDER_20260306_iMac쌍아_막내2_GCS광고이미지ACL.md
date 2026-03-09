---
type: order
date: 2026-03-06
from: iMac/쌍아
to: iMac/막내2
status: pending
---

# [지시서] 렌더링 화면 광고 이미지 — GCS ACL + 임시 로딩

> **[2026-03-06 14:59 KST] iMac/쌍아 → iMac/막내2**
> 작가님 E2E 지적 #6. 렌더링 결과 화면에서 광고 이미지가 표시되지 않음.

---

## 현상

- 리터칭 진행 중 표시되는 광고 슬라이드 영역이 빈 화면
- `result.js` 라인 27의 manifest.json은 로드되나 개별 이미지가 403 Forbidden

## 원인

- GCS 버킷 `monk-ai-images/ads/` 이미지에 `allUsers:R` 공개 ACL 미설정
- manifest.json은 개별 ACL로 공개 설정됨, 이미지 파일은 미설정
- 기존 지시서: `docs/monkos/tasks/2026-02/TASK_20260221_막내1_gcs_ads_public.md` (미완료 상태)

## 관련 코드

| 파일 | 위치 | 역할 |
|------|------|------|
| `monkos_AI/idphoto-kr/public/result.js` | 라인 26-76 | 광고 manifest 로드 + 로테이션 |
| `monkos_AI/idphoto-kr/public/result.html` | 라인 218-228 | 광고 슬라이드 영역 마크업 |
| `monkos-ops/scripts/ads_sync.py` | 전체 | GCS 광고 동기화 스크립트 |
| `monkos-ops/scripts/ads_upload.sh` | 전체 | launchd 트리거 |

## 작업 내용

### Step 1: GCS ACL 공개 설정

```bash
# ads/ 폴더 내 모든 이미지에 공개 읽기 권한 부여
gsutil -m acl ch -r -u AllUsers:R gs://monk-ai-images/ads/
```

- 실행 후 curl로 이미지 URL 직접 접근 확인 (200 OK)
- manifest.json 내 이미지 URL 최소 1개로 검증

### Step 2: 이미지 없을 경우 임시 대응

만약 ads/ 폴더에 실제 이미지가 없거나 부족한 경우:

1. 현재 GCS에 어떤 이미지가 있는지 확인:
   ```bash
   gsutil ls gs://monk-ai-images/ads/
   ```

2. 이미지가 없으면 **임시 이미지 로딩** 처리:
   - result.js의 `showAdImage()` (라인 68-76)에 이미지 로드 실패 시 fallback 추가
   - `img.onerror` 핸들러로 플레이스홀더 표시 또는 광고 영역 숨김

### Step 3: ads_sync.py ACL 자동화

- `ads_sync.py`에서 업로드 시 `allUsers:R` ACL이 자동 설정되도록 확인/수정
- 향후 이미지 추가 시 수동 ACL 작업 불필요하도록

---

## ⚠️ 준수 조항

- **헌법 2조**: 완료 보고 필수
- **헌법 6조**: 서비스 계정 키 생성·추측 금지. 기존 ADC 인증 사용
- **헌법 8조**: `gsutil rm` 등 삭제 명령 금지
- **법률 6장**: 커밋 메시지 `[fix] GCS 광고 이미지 ACL 공개 설정 + fallback 처리`

---

## 배포

- 코드 수정이 있을 경우 idphoto-kr Cloud Run 재배포
- ACL 설정만으로 해결되면 재배포 불필요
