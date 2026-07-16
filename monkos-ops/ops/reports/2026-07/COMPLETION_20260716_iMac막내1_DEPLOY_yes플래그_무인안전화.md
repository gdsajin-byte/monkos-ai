---
type: completion
date: 2026-07-16
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 완료
order: ORDER_20260716_iMac민아_막내_DEPLOY_yes플래그_무인안전화.md
---

# deploy.sh --yes + 비TTY 명시 실패 — 완료 보고

**[2026-07-16 16:48 KST]** iMac/막내1 → 작가님

---

## 적용 서비스

| 서비스 | 파일 | 변경 내용 |
|--------|------|---------|
| **portal** | monkos_AI/portal/deploy.sh | prod·preview 확인에 --yes 파싱 + 비TTY exit 1 |
| **idphoto-kr** | monkos_AI/idphoto-kr/deploy.sh | prod 확인에 --yes 파싱 + 비TTY exit 1 |
| **idphoto-jp** | monkos_AI/idphoto-jp/deploy.sh | prod 확인에 --yes 파싱 + 비TTY exit 1 |
| **studio** | monkos_AI/studio/deploy.sh | prod 확인에 --yes 파싱 + 비TTY exit 1 |

## 대상 외

| 서비스 | 사유 |
|--------|------|
| crop-engine | 확인 프롬프트 없음 (26줄 단순 스크립트, 환경 분기 없음) |
| imagen4/backend | 확인 프롬프트 없음 (staging/prod 구분만) |

## 구현 상세

```bash
# 인자 파싱 (--yes/-y 지원)
AUTO_YES=0
ENV=""
for arg in "$@"; do
  case "$arg" in
    --yes|-y) AUTO_YES=1 ;;
    *) [ -z "$ENV" ] && ENV="$arg" ;;
  esac
done

# prod 확인 지점 (기존 read 래핑)
if [ "$AUTO_YES" != "1" ]; then
  if [ ! -t 0 ]; then
    echo "ERROR: 비TTY 환경에서는 --yes 플래그가 필요합니다 (ch5)" >&2
    exit 1
  fi
  # 기존 y/N 프롬프트 유지
fi
```

## 검증 결과

| 테스트 | 기대 | 실측 |
|--------|------|------|
| `echo "" \| deploy.sh prod` | exit 1 + 에러 메시지 | ✅ 4개 서비스 전부 통과 |
| `printf 'n\n' \| deploy.sh prod` | exit 1 (비TTY 선 거부) | ✅ |
| `bash -n deploy.sh` | 문법 오류 0 | ✅ 4개 전부 OK |
| dev 배포 (무확인) | 변경 없음 | ✅ 무접촉 확인 |

## 커밋

- `ca54ec6c` — `[fix] deploy.sh --yes + 비TTY 명시 실패 — ch5 무인 실행 안전 조문의 코드 집행`
