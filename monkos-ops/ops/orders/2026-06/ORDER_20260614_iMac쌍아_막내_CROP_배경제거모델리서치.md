---
type: order
id: ORDER_20260614_iMac쌍아_막내_CROP_배경제거모델리서치
date: 2026-06-14 17:39 KST
from: iMac/쌍아
to: 막내
portfolio: PF_CROP
priority: P2
status: 완료
---

# 배경 제거 모델 + 후처리 기법 리서치

> **[2026-06-14 17:39 KST] iMac/쌍아 → 막내**
> 귀속: PF_CROP
> 배경: BiRefNet(MIT) 확정이나 복잡 배경에서 한계. 후처리 보강 + 대안 모델 탐색.

---

## 목표

배경 제거 품질을 서비스 수준으로 올리기 위한 모델·기법 리서치. 코드 작성 없이 조사·비교·보고만.

---

## 조사 항목

### 1. 후처리(Alpha Matting) 기법 비교

| 기법 | 조사 포인트 |
|---|---|
| **PyMatting** | 품질·속도·Python 통합 용이성 |
| **GuidedFilter (OpenCV)** | 속도 이점, 품질 한계 |
| **Deep Image Matting (DIM)** | 딥러닝 기반 매팅, 품질 최상이나 추가 모델 필요 |
| **ViTMatte** | Transformer 기반 최신 매팅, 품질·라이선스 |
| **MODNet / PPMatting** | 인물 특화 매팅 모델 |

### 2. 배경 제거 대안 모델 (상업 무료 라이선스만)

| 모델 | 조사 포인트 |
|---|---|
| **InSPyReNet** | 최근 SOTA 후보, 라이선스·품질 |
| **DIS (Dichotomous Image Segmentation)** | 고해상도 세밀 분할, IS-Net 후속 |
| **SAM 2 (Segment Anything)** | Meta 오픈소스, 프롬프트 기반 세그멘테이션 |
| **BiRefNet-v2** | 최신 버전 존재 여부·개선점 |

### 3. 하이브리드 파이프라인 사례

- BiRefNet + ViTMatte 조합 사례
- coarse mask → fine matting 2단계 파이프라인 벤치마크 자료
- remove.bg / PhotoRoom 등 상용 서비스의 알려진 아키텍처

### 4. 온디바이스 (참고)

- ML Kit Subject Segmentation 실 품질 사례 (Android)
- Apple Vision PersonSegmentation 대비 품질 격차 근거

---

## 산출물

**리서치 보고서**: `REPORT_20260614_막내_CROP_배경제거모델리서치.md`

보고서 형식:
```markdown
## 후처리 기법 비교
| 기법 | 품질 | 속도 | 라이선스 | GPU 필요 | 추천 |

## 대안 모델 비교
| 모델 | 품질 | 속도 | 라이선스 | VRAM | 비고 |

## 하이브리드 파이프라인 사례
| 조합 | 출처 | 결과 |

## 권고
```

---

## ⚠️ 준수 조항

- 코드 작성·실행 없음 — 리서치만
- 라이선스 반드시 명기 (상업 불가 모델은 명확히 표시)
- 출처 URL 필수

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시
