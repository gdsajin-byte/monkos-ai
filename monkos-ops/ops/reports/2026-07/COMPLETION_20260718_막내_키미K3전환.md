---
type: completion
date: 2026-07-18
device: iMac
agent: 막내
status: 마감
---

# COMPLETION: Kimi 모델 K2.6 → K3 전환

## 요약
작가님 지시에 따라 Kimi K3 출시를 반영, 프로젝트 스크립트와 Kimi CLI 기본 모델을 모두 `kimi-k3`로 변경함.

## ✅ 변경 사항
- `scripts/tools/kimi.sh`: `MODEL="kimi-k2.6"` → `MODEL="kimi-k3"`
- `~/.kimi/config.toml`: `default_model = "moonshot-ai/kimi-k2.7-code"` → `"moonshot-ai/kimi-k3"`

## ✅ 검증
- 공식 문서(`https://platform.kimi.ai/docs/overview`)에서 `kimi-k3` 모델 ID 실측 확인
- `git diff scripts/tools/kimi.sh`로 변경 내역 확인
- `grep default_model ~/.kimi/config.toml`로 Kimi CLI 기본 모델 확인
- 프로젝트 내 기타 런타임 모델 설정(`*.js`, `*.ts`, `*.json`, `*.sh`, `*.env`, `*.yml`, `*.yaml`, `*.py`) 추가 발견 없음

## ❌ 보안 이슈
- `.env`와 `~/.kimi/config.toml`에 Kimi API 키가 평문으로 중복 저장되어 있음
- `~/.kimi/config.toml`의 `api_key` 필드를 제거하고 `KIMI_API_KEY` 환경 변수만 사용하도록 개선 권장

## 🔀 추가 이슈 해결: Kimi CLI 업그레이드 실패
- 증상: 새 터미널에서 `mk-k` 실행 시 `kimi-cli update available` → `[Enter]` 선택 시 `uv tool upgrade kimi-cli` 실패
- 원인: `mk-k` 별칭은 `/Library/Frameworks/Python.framework/Versions/3.13/bin/kimi` 실행. `kimi-cli`가 `pip`으로 설치되어 있었으나, Kimi CLI 낸 업데이터가 `uv tool upgrade`를 시도하여 실패
- 조치: `/Library/Frameworks/Python.framework/Versions/3.13/bin/python3.13 -m pip install --upgrade kimi-cli` 실행 → 1.47.0 → 1.49.0 업그레이드 성공

## 📊 부가 분석: Kimi API 가격 비교 (2026-07-18 실측)
출처: `https://platform.kimi.ai/docs/pricing/chat-*.md` 공식 Markdown 원본. 단위: USD/1M tokens, 세금 별도.

| 모델 | Input (Cache Hit) | Input (Cache Miss) | Output | Context Window |
|------|-------------------|--------------------|--------|----------------|
| Kimi K3 | $0.30 | $3.00 | $15.00 | 1M |
| Kimi K2.7 Code | $0.19 | $0.95 | $4.00 | 256K |
| Kimi K2.7 Code HighSpeed | $0.38 | $1.90 | $8.00 | 256K |
| Kimi K2.6 | $0.16 | $0.95 | $4.00 | 256K |
| Kimi K2.5 | $0.10 | $0.60 | $3.00 | 256K |

- K3는 K2.6/K2.7 Code 대비 약 **3.6배** 비쌈 (1M input + 1M output 기준)
- K3는 K2.5 대비 약 **5배** 비쌈
- 현재 잔액 기준 사용량(1M input + 1M output 가정): K3 약 370K tokens, K2.6 약 1,344K tokens, K2.5 약 1,849K tokens

## 🛠️ 추가 개선: 매 턴 사용량/비용/잔액 표시
- 작가님 제안으로 `scripts/tools/kimi.sh`에 매 턴 입력/출력 토큰, 예상 비용, 잔액 표시 기능 추가
- macOS 기본 bash(3.2) 호환을 위해 Python one-liner에서 가격/비용 계산 처리
- 지원 모델 및 가격: K3(in $3.0/out $15.0), K2.7 Code(in $0.95/out $4.0), K2.6(in $0.95/out $4.0), K2.5(in $0.60/out $3.0)
- `.bash_profile`의 `mk-k` 별칭을 개선된 `scripts/tools/kimi.sh`로 연결
- Kimi CLI 본체는 `kimi-agent` 별칭으로 계속 사용 가능
- 테스트 결과 예시: `안녕` → 입력 119 tokens / 출력 155 tokens / 비용 $0.002682 / 잔액 $5.97

## 💡 후속 제안
- 새 터미널에서 `mk-k` 실행하여 사용량/비용/잔액 표시가 정상 작동하는지 실측 권장
- K3 사용 시 Output 비용($15/1M)이 높으므로 장문 응답/코드 생성에서 비용 주의
- 비용 절감이 필요하면 `~/.kimi/config.toml`의 `default_model`을 `moonshot-ai/kimi-k2.7-code`로 전환 검토
- API 키 중복 저장 정리 필요 시 별도 지시 요청
- 커밋·푸시는 작가님 확인 후 진행
