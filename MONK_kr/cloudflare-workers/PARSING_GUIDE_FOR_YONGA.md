# 🐉 용아(Gemini) - 15MB 컨텍스트 파싱 가이드

## 임무: 대표님의 15MB 대화 기록을 '샬라미'로 슬라이싱

---

## 📋 입력 데이터

- **파일명**: `master_context_YYYYMMDD_HHMMSS.txt`
- **크기**: ~15MB (약 750만 자)
- **위치**: R2 Bucket `monk-chat-logs/knowledge-base/`
- **내용**: 대표님의 Gemini 대화 기록 (시계열 순서)

---

## 🎯 출력 목표

**D1 테이블 `knowledge_slices`에 500~1,000개의 정제된 샬라미 저장**

각 샬라미는:
1. **tag**: `#가격전략`, `#보정기술`, `#대표님철학` 등
2. **situation**: 어떤 상황에서 쓰이는 지식인가?
3. **content**: 실제 Llama가 참고할 200~500자 엑기스
4. **importance_weight**: 1~10 (중요도)
5. **recency_score**: 1~10 (최근일수록 높음)
6. **source_date**: 원본 대화 날짜
7. **project_category**: `MONK사진관`, `AI_LAB`, `B2B`, `전략/기획` 등

---

## 🔪 슬라이싱 전략

### 1단계: 시계열 분석
```
- 대화 기록의 날짜/시간 패턴 파악
- 최근 1개월 → recency_score: 10
- 1~3개월 → recency_score: 8
- 3~6개월 → recency_score: 6
- 6개월 이상 → recency_score: 4
```

### 2단계: 프로젝트별 분류
```
키워드 기반 자동 분류:
- "증명사진", "보정", "촬영" → project_category: "MONK사진관"
- "AI", "키오스크", "봇", "라마" → project_category: "AI_LAB"
- "영업", "마케팅", "전략" → project_category: "전략/기획"
- "B2B", "기업", "출장" → project_category: "B2B"
```

### 3단계: 중복 제거
```
- 같은 주제가 여러 번 반복되면 가장 최신 버전만 채택
- 단, 시간에 따라 논리가 발전했으면 둘 다 보존 (weight 조정)
```

### 4단계: 엑기스 추출
```
- 긴 대화에서 핵심 멘트만 200~500자로 압축
- "대표님 말투"를 살릴 것 (비유, 단언, 확신)
- 구체적인 숫자, 사례는 반드시 포함
```

---

## 🏷️ 태그 체계 (예시)

| 태그 | 설명 | 예시 상황 |
|------|------|-----------|
| `#가격전략` | 가격 관련 영업 응대 | 고객이 "비싸다" 할 때 |
| `#보정기술` | 사진 보정 범위 설명 | "얼마나 보정해주나요?" |
| `#대표님철학` | MONK의 핵심 가치관 | 브랜드, 차별화 설명 시 |
| `#진상대응` | 까다로운 고객 대응법 | 컴플레인, 환불 요구 |
| `#AI솔루션` | AI/키오스크 영업 | "키오스크랑 뭐가 다른가요?" |
| `#예약안내` | 예약 시스템 설명 | "어떻게 예약하나요?" |
| `#경쟁전략` | 경쟁사 대응 논리 | "남들이 따라하면?" |
| `#기술설명` | AI 기술 쉽게 풀어쓰기 | "라마가 뭐예요?" |

---

## 💾 출력 형식 (SQL INSERT)

```sql
INSERT INTO knowledge_slices 
(tag, situation, content, importance_weight, recency_score, source_date, project_category) 
VALUES 
('#가격전략', 
 '고객이 가격 대비 가치를 의심할 때', 
 '가격 그 이상의 가치를 드립니다. 한 번 찍고 평생 쓰는 사진, 제대로 찍는 게 진짜 남는 거죠. 저렴한 곳과 비교하시면 품질 차이를 바로 느끼실 겁니다.',
 9, 
 10, 
 '2025-12-15', 
 'MONK사진관');
```

---

## ⚠️ 주의사항

1. **개인정보 제거**: 고객 이름, 전화번호 등은 모두 삭제
2. **중요도 산정 기준**:
   - 영업 직결 (가격, 예약, 클로징) → 9~10
   - 기술 설명, 차별화 → 7~8
   - 일반 안내, 절차 → 5~6
   - 참고용 배경 지식 → 3~4
3. **최종 목표**: **Llama 3.2 3B가 대표님처럼 말하게 만드는 것!**

---

## 🚀 실행 예시 (Vertex AI / Gemini API)

```python
# 용아가 실행할 파이썬 스크립트 (개념)
raw_text = r2_bucket.get('knowledge-base/master_context_20260107.txt')
slices = gemini_analyze(raw_text, guidelines=THIS_GUIDE)

for slice in slices:
    d1.execute(f"INSERT INTO knowledge_slices VALUES ({slice})")
```

---

**용아, 이 가이드대로 15MB를 완벽히 요리해줘!** 🐉🔥
