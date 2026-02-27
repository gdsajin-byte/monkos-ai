# MONK AI Engine 로드맵
## GCP Cloud Run + Vertex AI 전환 전략

---

## 📌 배경

### 문제
1. **생성 제약**: Vertex AI/Imagen은 내부 테스트 시 관대, 공개 배포 시 제약 강화
2. **보안 사고**: 외부 프록시(Cloudflare Workers)에서 유령 ID 발생 경험
3. **구조적 한계**: 현재 구조는 "외부 서비스 → Google API" 형태

### 해결 방향
**GCP 내부에서 엔진 실행** → "내부 활동"으로 인식 → 제약 최소화

---

## 💰 보유 자원

| 항목 | 내용 |
|------|------|
| Vertex AI 바우처 | **$1,500 (≈260만원)** |
| 유효 기간 | **3개월** |
| 프로젝트 | startMONK (gen-lang-client-0105707468) |

---

## 🏗️ 목표 아키텍처

```
[MONK.kr 웹] ─→ [Cloud Run 엔진] ─→ [Vertex AI Imagen]
(Cloudflare)      (GCP 내부)           (GCP 내부)
    정적 파일         API 서버             이미지 생성
                        │
                        ▼
                 [Cloud Storage]
                   이미지 저장
```

### 역할 분담

| 레이어 | 서비스 | 역할 |
|--------|--------|------|
| 프론트엔드 | Cloudflare Pages | 정적 웹 파일 (무료) |
| 백엔드 엔진 | **GCP Cloud Run** | API 서버, Imagen 호출 |
| AI 모델 | **Vertex AI** | Imagen 4/3 이미지 생성 |
| 저장소 | **Cloud Storage** | 생성 이미지 저장 |
| 메타데이터 | Cloudflare D1 or Cloud Firestore | 사용자/생성 기록 |

---

## 📊 예상 비용 (바우처 내)

```
Imagen 생성:  $0.03~0.04 / 장
Cloud Run:    ~$0.000025 / 요청
Storage:      $0.02 / GB-월

예상 생성량:  ~40,000장 (3개월)
예상 비용:    ~$1,200~1,500
```

**→ 바우처로 충분히 커버**

---

## 🎯 서비스 엔드포인트

| 엔드포인트 | 서비스 | 특화 |
|------------|--------|------|
| `/api/증명사진` | 증명사진 | 3:4 비율, 배경 처리 |
| `/api/프로필` | AI 프로필 | 다양한 비율/스타일 |
| `/api/룩북` | 룩북 | 배치 생성, 일관성 |
| `/api/generate` | 범용 | AI LAB 기본 생성 |

---

## 📅 구현 단계

### Phase 1: 기반 구축 (1주)
- [ ] GCS 버킷 생성 (`monk-ai-images`)
- [ ] Cloud Run 기본 서비스 배포
- [ ] Vertex AI 연동 테스트

### Phase 2: 엔진 개발 (2주)
- [ ] 이미지 생성 API 구현
- [ ] 서비스별 엔드포인트 (증명사진/프로필/룩북)
- [ ] 에러 핸들링 및 로깅

### Phase 3: 연동 (1주)
- [ ] 프론트엔드 → Cloud Run 연결
- [ ] 기존 Cloudflare Workers 역할 정리
- [ ] 테스트 및 안정화

### Phase 4: 서비스 런칭
- [ ] 실사용자 테스트
- [ ] 모니터링 설정
- [ ] 비용 추적

---

## ✅ 기대 효과

| Before | After |
|--------|-------|
| 외부 → Google (제약 있음) | GCP 내부 통신 (관대) |
| API 키 프록시 노출 위험 | 키 완전 은닉 (ADC) |
| Cloudflare 의존 | GCP 통합 관리 |
| 바우처 미사용 | 바우처 100% 활용 |

---

## ⚠️ 결정 필요 사항

1. **저장소 선택**: Cloud Storage vs Cloudflare R2
2. **DB 선택**: Firestore vs Cloudflare D1
3. **인증 방식**: API Key vs Firebase Auth
4. **도메인**: `api.monk.kr` 설정 여부

---

## 🔗 참고

- 프로젝트: startMONK
- 프로젝트 ID: `gen-lang-client-0105707468`
- 현재 API: 정상 작동 중
- 바우처 만료: 3개월 내

---

**작성일**: 2026-01-12  
**작성자**: 쌍아 (Claude)  
**검토 요청**: 용아 (Gemini)
