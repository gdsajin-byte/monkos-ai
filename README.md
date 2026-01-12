# MONK.kr Project

## 🔄 현재 상태 (Last Updated: 2026-01-13 01:30)

### ✅ 오늘 완료한 작업

1. **AI PHOTO (소소방)** - 상품 라인업 완성
   - 이력서 세트 (75cr)
   - 컬러증명 세트 (75cr)
   - 프로필 세트 (100cr)
   - 신분증 세트 (150cr)
   - 장수/영정 (600cr, 액자포함, 택배별도)
   - 사진 복원 (250cr)
   - 고품질 인화/액자 (상품별 상이, 택배별도)
   - 크레딧 충전 패키지 (이중 생색 UI)

2. **LOOKBOOK** - 3-Layer 컨셉 UI
   - 모델 × 배경 × 타이포 = LOOKBOOK
   - Coming Soon 상태 (데이터 파이프라인 구축 필요)
   - 퀵 데모 기능 유지

3. **민아방 (AI Model Agency)** - 24/7 런웨이 완성
   - Cloudflare Images 연동 (21장)
   - 워터마크 보호 (MONK.kr 로고 + MIN_A)
   - 자동 슬라이드 5초 간격
   - 스와이프/터치 지원
   - ⚠️ 화질 개선 필요 (variant 설정 확인)

4. **MONKOS Business (쌍아방)** - 가격 구조 정리
   - 홈페이지 제작 중심 토탈 솔루션
   - 패키지/월정액 구조

5. **문서 정리**
   - 루트 문서들 → docs/saga, docs/infrastructure로 이동
   - .cursorrules 업데이트

### 📋 다음 세션 TODO

- [ ] 민아방 화질 개선 (Cloudflare Images variant 설정)
- [ ] R&D 제출 서류 작성 (마감: 금요일)
- [ ] Cloud Run + Vertex AI 백엔드 연동
- [ ] AI PHOTO 실제 API 연결

### ⚠️ 주의사항

- **API 토큰 노출됨** - Cloudflare Images API 토큰이 대화에 노출됨. 필요시 재생성 권장
- **민아방 이미지** - 저작권 보호 자산. 워터마크 유지 필수
- **R&D 마감** - 다음주 금요일

### 📁 주요 파일 위치

```
MONK_kr/ai_lab/
├── so_so/apps/ai_photo.html   ← AI PHOTO 메뉴판
├── so_so/apps/lookbook.html   ← LOOKBOOK (Coming Soon)
├── min_a/min_a.html           ← 민아 런웨이 (24/7)
├── ssang_a/ssang_a.html       ← MONKOS Business
└── ai_lab.html                ← AI LAB 메인
```

---
© 2026 MONK STUDIO
