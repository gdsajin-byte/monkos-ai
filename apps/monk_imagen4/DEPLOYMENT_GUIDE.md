# 🚀 배포 가이드 - Imagen4 Generator

## Phase 1: 초기 무료 제공 (현재)

### Cloudflare Pages 배포

1. **D1 데이터베이스 생성**
```bash
wrangler d1 create monk-ai-db
# DATABASE_ID를 wrangler.toml에 업데이트
```

2. **D1 스키마 적용**
```bash
wrangler d1 execute monk-ai-db --file=./schema.sql
```

3. **R2 버킷 생성**
```bash
wrangler r2 bucket create monk-ai-images
```

4. **API 키 설정**
```bash
# Google AI Studio에서 API 키 발급 후
wrangler pages secret put GEMINI_API_KEY
# 프롬프트에서 API 키 입력
```

5. **빌드 & 배포**
```bash
npm run build
wrangler pages deploy dist
```

### 현재 Rate Limit 설정
- **IP당**: 3회/시간
- **전체**: 100회/일
- **모니터링**: D1에 모든 요청 로깅

## Phase 2: 바우처 활용 (Vertex AI 전환)

### Vertex AI 설정
1. GCP 프로젝트 생성
2. Vertex AI API 활성화
3. 서비스 계정 생성 및 JSON 키 발급
4. `functions/api/generate.ts`에서 Vertex AI 엔드포인트로 변경

### Rate Limit 조정
- **IP당**: 10회/일
- **전체**: 500-1000회/일

## Phase 3: 유료 전환

### Option A: 완전 유료
- 로그인 시스템 구현
- Stripe 결제 연동
- 크레딧 시스템

### Option B: 하이브리드
- 무료: 1회/일
- 유료: 무제한

## 사용량 모니터링

### D1 쿼리
```sql
-- 일일 사용량
SELECT COUNT(*) FROM usage_logs 
WHERE timestamp > strftime('%s', 'now', '-1 day') * 1000;

-- IP별 사용량
SELECT ip_address, COUNT(*) as requests 
FROM usage_logs 
WHERE timestamp > strftime('%s', 'now', '-1 day') * 1000
GROUP BY ip_address 
ORDER BY requests DESC;

-- 시간별 사용량
SELECT 
  strftime('%H:00', datetime(timestamp/1000, 'unixepoch')) as hour,
  COUNT(*) as requests
FROM usage_logs 
WHERE timestamp > strftime('%s', 'now', '-1 day') * 1000
GROUP BY hour;
```

## 보안 강화

### Turnstile 추가 (봇 차단)
1. Cloudflare Turnstile 위젯 추가
2. 프론트엔드에서 토큰 생성
3. 백엔드에서 토큰 검증

### IP 블랙리스트
악용하는 IP를 D1에 저장하고 차단

## 비용 최적화

### Google AI Studio (무료)
- 15 RPM (분당 요청)
- 1,500 RPD (일당 요청)
- 1.5M TPM (분당 토큰)

### Vertex AI (바우처)
- 더 높은 한도
- 프로덕션 안정성
- 커스텀 모델 지원

## 문제 해결

### Rate Limit 초과 시
```bash
# D1에서 특정 IP 사용량 리셋
wrangler d1 execute monk-ai-db --command="DELETE FROM usage_logs WHERE ip_address = 'xxx.xxx.xxx.xxx'"
```

### 전체 사용량 리셋
```bash
wrangler d1 execute monk-ai-db --command="DELETE FROM usage_logs WHERE timestamp < strftime('%s', 'now', '-1 day') * 1000"
```
