# MONK_kr — monk.kr 본진 포털

> Cloudflare Pages 정적 호스팅 | 도메인: **monk.kr**

## 배포

```bash
wrangler pages deploy MONK_kr/ --project-name=monk-kr
```

- **Pages Functions**: 루트 `functions/api/` 자동 포함 (별도 README 참조)
- **브랜치 제한 없음** (정적 사이트)
- wrangler 4.66.0+

## 핵심 구조

```
MONK_kr/
├── index.html              ← 메인 포털
├── config.js               ← API 엔드포인트 설정
├── ai_lab/
│   └── photolab/           ← AI 증명사진 앱 (MPA 분할)
│       ├── index.html      ← 앱 진입점
│       ├── prep.html/js    ← 촬영 전 코칭
│       ├── camera.html/js  ← 카메라 촬영
│       ├── result.html/js  ← 결과 + 다운로드
│       ├── thankyou.html/js← 감사 페이지 (무료/유료 게이트)
│       ├── app.js/css      ← 핵심 로직
│       ├── shared.js       ← 공유 유틸
│       └── config.js       ← photolab 설정
├── Academy/                ← 아카데미
├── b2b/                    ← B2B
├── monk_studio/            ← 스튜디오
├── robots.txt
└── sitemap.xml
```

## 환경변수 (CF Pages Secrets)

| 변수 | 용도 |
|------|------|
| `GEMINI_API_KEY` | Gemini API (photo, idgen, precheck, qc, coaching) |
| `KAKAO_CLIENT_ID` | 카카오 OAuth |
| `KAKAO_CLIENT_SECRET` | 카카오 OAuth |
| `GOOGLE_CLIENT_ID` | 구글 OAuth |
| `GOOGLE_CLIENT_SECRET` | 구글 OAuth |
| `TELEGRAM_BOT_TOKEN` | 텔레그램 봇 |
| `ADMIN_CHAT_ID` | 관리자 알림 채팅방 |
| `TOSS_SECRET_KEY` | 토스페이먼츠 결제 |
| `TX_API_KEY` | 거래 관리 API |

D1 바인딩: `DB` → `monk-db` (wrangler.toml)

## 외부 연동

| 서비스 | 용도 | 설정 위치 |
|--------|------|-----------|
| Gemini 3 Pro | I2I 증명사진 생성 | functions/api/idgen.js |
| Gemini 2.0 Flash | 사전분석/QC/코칭 | functions/api/precheck,qc,coaching |
| 카카오/구글 OAuth | 사용자 인증 | functions/api/auth.js |
| 토스페이먼츠 | 결제 | functions/api/payment.js |
| 텔레그램 | 봇 알림 | functions/api/telegram*.js |
| Cloudflare D1 | 사용자/거래/방문자 DB | functions/api/tx,visitor,simple-signup |

## 주의사항

- `config.js` 내 API 엔드포인트 URL 변경 시 전체 영향
- `wrangler.toml` 수정 금지 (법률 제7장 3조)
- photolab 내 `_backup_*/`, `_legacy/` 폴더는 건드리지 않음
