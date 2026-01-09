빨# Cloudflare R2 + D1 설정 가이드

## 📦 필요한 준비물
- Cloudflare 계정
- wrangler CLI 설치

## 🚀 설정 단계

### 1. Wrangler CLI 설치
```bash
npm install -g wrangler
wrangler login
```

### 2. R2 버킷 생성
```bash
wrangler r2 bucket create monk-ai-images
```

### 3. D1 데이터베이스 생성
```bash
wrangler d1 create monk-ai-db
```

출력된 `database_id`를 복사하여 `wrangler.toml` 파일의 `database_id` 필드에 붙여넣으세요.

### 4. D1 스키마 적용
```bash
wrangler d1 execute monk-ai-db --file=./schema.sql
```

### 5. R2 Public Access 설정 (선택사항)
Cloudflare 대시보드에서:
1. R2 → monk-ai-images 버킷 선택
2. Settings → Public Access
3. Custom Domain 또는 R2.dev subdomain 활성화
4. `functions/api/upload.ts`의 `imageUrl` 값을 실제 도메인으로 변경

### 6. 로컬 개발
```bash
npm run dev
```

Pages Functions는 자동으로 `/api/upload` 엔드포인트로 매핑됩니다.

### 7. 배포
```bash
npm run build
wrangler pages deploy dist
```

## 📊 데이터베이스 쿼리

### 최근 이미지 조회
```bash
wrangler d1 execute monk-ai-db --command="SELECT * FROM images ORDER BY timestamp DESC LIMIT 10"
```

### 특정 모드 이미지 조회
```bash
wrangler d1 execute monk-ai-db --command="SELECT * FROM images WHERE mode='T2I'"
```

## 🔐 환경변수

필요시 Cloudflare Pages 대시보드에서 환경변수를 추가할 수 있습니다:
- Settings → Environment variables → Add variable

## ✅ 확인사항

- [x] R2 버킷 생성 완료
- [x] D1 데이터베이스 생성 완료
- [x] 스키마 적용 완료
- [x] wrangler.toml 설정 완료
- [x] Public domain 설정 (선택)

## 📝 작동 방식

1. 사용자가 이미지 생성
2. `downloadActive()` 또는 자동 저장 트리거
3. `/api/upload` 엔드포인트 호출
4. R2에 이미지 업로드 (`생성모델폴더/` 경로)
5. D1에 메타데이터 저장
6. 클라이언트로 URL 반환
