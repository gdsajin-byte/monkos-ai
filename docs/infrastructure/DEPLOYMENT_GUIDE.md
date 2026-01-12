# 🚀 MONK.KR 빠른 배포 가이드

**작성일**: 2026-01-08 17:30  
**전략**: 옵션 1 - 빠른 배포 (점진적 접근)  
**목표**: 현재 구조 그대로 monk.kr에 배포 → 실전 테스트 → 2중 배치 업그레이드

---

## 📋 배포 전 체크리스트

### ✅ 완료된 것
- [x] CS Q&A 시스템 (79개, D1 동기화)
- [x] Cloudflare Workers 배포 (환각 방지 완료)
- [x] QA 검증 시스템
- [x] GCS 데이터 백업
- [x] 로컬 HTML 파일 준비

### 📂 배포할 파일
```
MONK_kr/
  ├─ index.html .................... [19.8 KB] ✅
  ├─ monk_studio/
  │  └─ monk_studio.html ........... [26.1 KB] ✅
  ├─ ai_lab/
  │  └─ ai_lab.html
  ├─ b2b/
  │  └─ b2b.html
  ├─ Academy/
  │  └─ academy.html
  └─ images/ ........................ [전체]
```

---

## 🎯 배포 방법 (3가지 옵션)

### 방법 1: Cloudflare Pages (권장 ⭐)

#### 장점
- 무료 호스팅
- 자동 HTTPS
- CDN 자동 적용
- Git 연동 가능

#### 단계
```bash
# 1. Cloudflare Dashboard → Pages → Create Project
# 2. "Upload assets" 선택
# 3. MONK_kr 폴더 전체 드래그 앤 드롭
# 4. "monk" 또는 "monk-kr" 프로젝트명 입력
# 5. Deploy 클릭

# 결과: https://monk-kr.pages.dev (자동 생성)
# 커스텀 도메인: monk.kr 연결
```

#### 커스텀 도메인 연결
```
Cloudflare Pages → 프로젝트 → Custom domains
→ "monk.kr" 입력 → DNS 자동 설정
```

---

### 방법 2: FTP 배포

#### 단계
```bash
# 1. FTP 클라이언트 (FileZilla, Cyberduck 등)
# 2. 호스팅 서버 연결
# 3. MONK_kr 폴더 전체 업로드
# 4. 권한 설정 (755)
```

---

### 방법 3: Cloudflare R2 + Workers (정적 호스팅)

#### 단계
```bash
# 1. R2 버킷 생성
wrangler r2 bucket create monk-kr-static

# 2. 파일 업로드
cd /Users/jeong-kyushin/developer/monk_project\ /MONK_kr
gsutil -m rsync -r . gs://monk-project-soul/monk_kr_deploy/
# 또는
wrangler r2 object put monk-kr-static/index.html --file=index.html

# 3. Worker로 정적 호스팅
# (별도 Worker 코드 필요)
```

---

## 🔧 배포 전 최종 확인

### 1. API 엔드포인트 확인
```bash
# index.html
grep -n "monk-gemini-proxy" MONK_kr/index.html
# 결과: https://monk-gemini-proxy.gdsajin.workers.dev ✅

# monk_studio.html
grep -n "monk-gemini-proxy" MONK_kr/monk_studio/monk_studio.html
# 확인 필요
```

### 2. CORS 설정 확인
```javascript
// cloudflare-workers/src/index.js
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // ✅ 모든 도메인 허용
};
```

### 3. D1 데이터 확인
```bash
# 로컬
cd MONK_kr/cloudflare-workers
npx wrangler d1 execute monk-services-db \
  --command="SELECT COUNT(*) FROM monk_cs_qa;" --local
# 결과: 79 ✅

# 리모트
npx wrangler d1 execute monk-services-db \
  --command="SELECT COUNT(*) FROM monk_cs_qa;" --remote
# 결과: 79 ✅
```

---

## 🚀 빠른 배포 스크립트

```bash
#!/bin/bash
# quick_deploy.sh

echo "🚀 MONK.KR 빠른 배포 시작..."

# 1. 로컬 파일 확인
echo "📂 배포 파일 확인..."
ls -lh MONK_kr/index.html
ls -lh MONK_kr/monk_studio/monk_studio.html

# 2. GCS에 백업 (안전장치)
echo "☁️  GCS 백업..."
gsutil -m rsync -r MONK_kr/ gs://monk-project-soul/monk_kr_deploy/

# 3. Cloudflare Pages 배포 (수동)
echo "📤 Cloudflare Pages로 이동하여 배포하세요:"
echo "   https://dash.cloudflare.com/pages"
echo ""
echo "   1. 'Upload assets' 클릭"
echo "   2. MONK_kr 폴더 드래그 앤 드롭"
echo "   3. 프로젝트명: monk-kr"
echo "   4. Deploy 클릭"
echo ""

# 4. 배포 완료 후 테스트
echo "✅ 배포 완료 후 테스트:"
echo "   - https://monk-kr.pages.dev (또는 monk.kr)"
echo "   - 메인 챗봇: '증명사진 얼마예요?' 테스트"
echo "   - 몽크사진관 챗봇: '예약 필요한가요?' 테스트"
echo ""
echo "💾 배포 로그 저장..."
date >> deployment_log.txt
echo "✅ 완료!"
```

---

## 🧪 배포 후 테스트 시나리오

### 시나리오 1: 메인 페이지 (index.html)
```
1. monk.kr 접속
2. 하단 챗봇 열기
3. "증명사진 얼마예요?" 입력
4. 기대 결과: "3만원" 또는 CS 공식 답변
5. 확인: 환각 답변 없음 (60만원, 120만원 등)
```

### 시나리오 2: 몽크사진관 (monk_studio.html)
```
1. monk.kr/monk_studio/monk_studio.html 접속
2. 챗봇 열기
3. "예약 필요한가요?" 입력
4. 기대 결과: "예약 없이 방문 가능, 네이버 플레이스..."
5. 확인: CS 공식 답변 반환
```

### 시나리오 3: 네이버 광고 루트
```
1. 네이버 광고 → monk.kr/monk_studio/
2. 챗봇으로 가격, 예약, 영업시간 질문
3. 기대 결과: 모두 정확한 CS 답변
4. 확인: 고객 이탈 없음
```

---

## 📊 모니터링

### 1. Worker 로그 확인
```bash
# 실시간 로그
wrangler tail monk-gemini-proxy

# 로그 분석
cd MONK_kr/cloudflare-workers
node analyze_logs.js
```

### 2. QA 자동 검증
```bash
# 5분마다 자동 실행 (Cron 설정)
*/5 * * * * python3 ~/developer/monk_project\ /MONK_kr/monk_cs/yonga_qa_validator.py

# 수동 실행
python3 MONK_kr/monk_cs/yonga_qa_validator.py
```

### 3. 성과 지표
```
- 챗봇 사용률
- 환각 답변 발생 횟수 (0 목표)
- 평균 응답 시간
- 고객 만족도 (피드백)
```

---

## 🔄 향후 업그레이드 (Phase 2)

### 2중 배치 완성
```
1. Vertex AI monk_main_desk 앱 생성
2. index.html → Vertex AI 연결 (용아)
3. monk_studio.html → Worker 유지 (라마)
4. 재배포
```

### 확장
```
- AI LAB 챗봇 (소소 특화)
- B2B 챗봇 (기업 전문)
- 아카데미 챗봇 (교육 특화)
```

---

## ⚠️ 주의사항

### 1. 배포 전 백업
```bash
# GCS 백업 (필수!)
gsutil -m rsync -r MONK_kr/ gs://monk-project-soul/monk_kr_backup_$(date +%Y%m%d)/
```

### 2. 롤백 계획
```
문제 발생 시:
1. Cloudflare Pages → Deployments → 이전 버전 선택 → Rollback
2. 또는 GCS 백업에서 복원
```

### 3. 긴급 연락
```
- Worker 오류: https://dash.cloudflare.com/workers
- D1 오류: wrangler d1 info monk-services-db
- DNS 오류: Cloudflare Dashboard → DNS
```

---

## ✅ 최종 체크리스트

배포 전:
- [ ] GCS 백업 완료
- [ ] Worker API 테스트 (curl)
- [ ] D1 데이터 확인 (79개)
- [ ] 로컬 HTML 최종 확인

배포 중:
- [ ] Cloudflare Pages 업로드
- [ ] 도메인 연결 (monk.kr)
- [ ] HTTPS 확인

배포 후:
- [ ] 3가지 시나리오 테스트
- [ ] QA 자동 검증 실행
- [ ] 로그 모니터링 시작

---

**Version**: 1.0  
**Status**: 배포 준비 완료  
**Next**: Cloudflare Pages 업로드 → 실전 테스트

---

**대표님, 이제 Cloudflare Pages로 가서 MONK_kr 폴더를 업로드하시면 됩니다!** 🚀
