---
type: review
date: 2026-09-26
device: iMac
agent: 막내2
status: 마감
portfolio: PF_KKU
subject: "PETITION_20260924(ch5 1조 monk.kr 버튼 배포) 행정 심사 — 옵스 통괄 문제점 전수"
petition: governance/constitution/petitions/PETITION_20260924_민아_ch5_1조_monk.kr_버튼배포.md
order: monkos-ops/ops/orders/2026-09/ORDER_20260926_iMac쌍아_막내2_PETITION20260924_행정심사.md
---

# 행정 심사 의견서 — PETITION_20260924 (ch5 1조 monk.kr 버튼 배포)

**[2026-09-26 13:45 KST]** iMac/막내2 → iMac/쌍아 (참조: 작가님)

> 역할: 행정 심사 — monkos-ops 통괄 행정상 문제점 전수 파악 (amendment.md 「헌법 개정」 2항)
> 심사 방식: 조문은 파일:행, 설정·코드·라이브는 실측. 0건 판정은 전부 대조군 병기.

---

## 0. 총평

**조건부 찬성.** 개정 방향(승인자 트리거 2경로)은 행정상 순이익이다 — 경로②는 러너의 신선한 체크아웃에서 배포하므로 09-24 "배포자 기기 종속" 사고가 **구조적으로 재발 불가**하며, ch5 1조가 조문으로만 갖고 있던 "루트 `functions/` 정본" 요건을 워크플로가 **게이트로 집행**한다(deploy-monk-kr.yml:23-27). 조문→게이트 승격은 amendment.md 「집행 방식」 원칙에 정면 부합한다.

다만 행정 관점에서 **개정을 통과시키기 전에 반드시 함께 처리해야 할 하자 4건(치명)** 과 **동기화 누락 11건**을 적발했다.

| # | 등급 | 적발 | 근거 |
|---|------|------|------|
| A1 | 🔴 치명 | **ch7 2조 111행이 `wrangler pages deploy`(monk.kr 배포)를 막내 "자유 작업 범위"로 등재** — 개정안이 "승인자 트리거만"을 선언하면 두 법률이 정면 충돌 | ch7:111 |
| A2 | 🔴 치명 | **워크플로 스모크 게이트가 공허하다** — monk-kr.pages.dev는 존재하지 않는 경로도 200/text/html을 반환. `[ "$code" = "200" ]` 어서션은 어떤 콘텐츠 사고도 잡지 못한다 | 라이브 실측 §2-4 |
| A3 | 🔴 치명 | **`secret map`이 GitHub Actions 소비처를 구조적으로 못 본다** — `secret.sh:301` pathspec에 `*.yml` 누락, 워크플로 9/9가 `.yml` | secret.sh:301 |
| A4 | 🔴 치명 | **GitHub Secrets를 관측하는 장치가 하나도 없다** — `secret_patrol.sh`는 SM+SA만 순찰. 2027-09-24 만료·로테이션 어긋남을 잡는 주체 부재 | patrol 실측 §2-2 |
| A5~A15 | 🟡 | 동기화 누락 11건 + 청구안 §4 오기 1건 | §1 표 |

---

## 1. 동기화 대상 전수 표

> 청구안 §4는 **2건**(`deploy-cf.md`·`rules/deployment.md`)을 든다. 실측 결과 **필수 13건 + 권고 4건**이다. 0건 항목은 대조군을 병기했다.

### 1-1. 필수 (개정과 동시 처리)

| # | 파일:행 | 현재 | 변경안 | 대조군 |
|---|---------|------|--------|--------|
| S1 | `governance/laws/ch5_deployment.md:10-15` | `- 배포 = \`wrangler pages deploy\` **수동 실행만** 허용.`(11행) | 청구안 §3 조문 4항으로 교체. 단 §3 4항에 **"본 조항은 monk.kr(CF Pages)에 한한다"** 적용범위 명기 (ch5 6조 게이트3의 "gitignore 산출물 해시 제외"와의 충돌 차단) | — |
| S2 | **`governance/laws/ch7_makne_code.md:111`** | `- \`wrangler pages deploy\` (monk.kr 배포)` — **자유 작업 범위(2조)** | 삭제 또는 `- \`wrangler pages deploy\` (monk.kr 배포) — **작가님 승인 수신 후에만**(ch5 1조·ch1 7조 2항)` 로 교체 | 같은 파일 `배포` 7건 히트 → grep 유효 |
| S3 | `.claude/rules/deployment.md:9` | `> source: governance/laws/ch5_deployment.md@2026-09-02` | `@{개정 커밋일}` 로 갱신 | governance-check C10이 `git log -1 --format=%as`와 대조(비블로킹 warning) |
| S4 | `.claude/rules/deployment.md` **본문** | **monk.kr·wrangler·CF Pages 언급 0건** (파일 전체가 Cloud Run 전용) | `## monk.kr (CF Pages)` 절 신설 — 2경로·승인자 트리거·push 금지·미추적 자산 금지 | **대조군: 같은 파일 `deploy.sh` 7건 히트** → grep 유효. 청구안 §4의 "1행 동기화"는 **오기**(고칠 1행이 없다, 절을 신설해야 한다) |
| S5 | **`.claude/rules/live-verify.md:1`** | `> source: governance/laws/ch5_deployment.md@2026-09-02` | 본문 무변경이라도 **스탬프 전이 갱신 필수** (정본이 같은 ch5) | 청구안 §4 **누락분**. 미갱신 시 C10 warning 2건 발생 |
| S6 | `.claude/commands/deploy-cf.md:6,21-28` | `> 원천: ch5 1조` + 3단계에 경로① 단일 | 경로② 절 추가(사유 서식·승인 기록·gh 명령). `> 원천:`은 자유문장이라 C10 대조 대상이 아님 → `> source: governance/laws/ch5_deployment.md@{날짜}` 병기 권고 | C10 루프 대상은 `.claude/rules/*.md` + ESSENCE뿐(governance-check.yml:74) → commands/는 기계 대조 밖 |
| S7 | `.claude/rules/references.md:62-74` (§배포) | monk.kr 배포 정본 표기 **0건** (Cloud Run·CF 엣지만) | `- **monk.kr 배포 정본**: 경로① `deploy-cf.md` 표준 명령 / 경로② `.github/workflows/deploy-monk-kr.yml`(workflow_dispatch)` 1~2행 추가 | **대조군: 같은 파일 CF 엣지 배포 정본 1건 히트**(65행) → 섹션·grep 유효 |
| S8 | `.claude/rules/references.md` §도구 맵 | **`github`·`workflow`·`Actions` 문자열 0건** — 워크플로 9본 전부 미등재 | 도구 맵에 `deploy-monk-kr.yml \| CLI/CI \| .github/workflows/ \| 작가님(버튼)` 1행. 3요건(인지·스모크·실패 가시화) 중 **인지 미충족 상태** | `grep -c "github\|workflow\|Actions" references.md` = **0**. 대조군: 같은 파일 `deploy.sh` 다수 히트 |
| S9 | `monkos-ops/tech/SERVICE_MAP.md:71` | `| 본진·monk.kr | \`MONK_kr/\` | — (CF Pages) | monk.kr | 🟢 | ... |` — 배포 경로 열 `—` | `— (CF Pages / 버튼 배포 `deploy-monk-kr.yml`)` 로 보강 | 같은 파일 monk.kr 2건 히트(21·71행) → grep 유효 |
| S10 | `monkos-ops/ops/SECRET_INVENTORY.md:277-300` (§3 GitHub Secrets) | CF_PAGES_DEPLOY_TOKEN·CF_ACCOUNT_ID **미등재** (§A #45·#46엔 등재) | §3 표에 2행 추가 + §3 전수 보정(아래 A6) | `gh secret list` 실측 26건 vs §3 등재 11건 → **15건 미등재** |
| S11 | **`scripts/secret.sh:301`** | `git grep -ln "$NAME" -- '*.sh' '*.js' '*.py' '*.yaml' '*.md'` | `'*.yml'` 추가 | 대조군: pathspec 없는 `git grep -ln CF_PAGES_DEPLOY_TOKEN` → `.github/workflows/deploy-monk-kr.yml` 히트. `-- '*.yml'` 지정 시에도 히트. **현행 pathspec으로는 0건** |
| S12 | **`scripts/secret.sh:161`** | `[인벤토리] 자동 맵이 반영한다 — 수기 추가 불필요 (secret map $NAME 으로 확인)` | 교정안 §2-3 | 민아 09-26 12:01 적발 확인 |
| S13 | `package.json:7` | `"deploy": "wrangler pages deploy MONK_kr --project-name monk-kr"` — `--branch main`·`--commit-dirty=true` 없음 | **제3의 비정본 배포 경로.** 삭제하거나 표준 명령과 동일하게 정본화 | ch5 1조 13행 표준 명령과 문자열 불일치 실측 |

### 1-2. 권고 (동시 처리 아니어도 되지만 장부화 필요)

| # | 파일:행 | 현재 | 변경안 |
|---|---------|------|--------|
| S14 | `.claude/commands/kku-context.md:65` | 꾸 **접근 불가 영역**에 `배포 (deploy.sh, Cloud Run, CF Pages)` | 개정 후에도 유지가 맞다면 "버튼 배포도 포함"을 명기. 꾸 자력 배포를 허용할 의사라면 §2-5의 3요건 동시 해소 필요 |
| S15 | `.claude/commands/makne-finish.md:65` | `배포: 3~4단계 + 배포 실행 (deploy-cf 또는 deploy-cr 절차)` | monk.kr은 승인 게이트 대상임을 1행 |
| S16 | `MONK_kr/README.md:8` / `MONK_kr/ai_lab/photolab/TECH_SPEC_MPA.md:299` | `--project-name=monk-kr` 등 구 변형 명령 | 표준 명령으로 통일 또는 "정본은 ch5 1조" 포인터 |
| S17 | `CLAUDE.md:204` 부근 | 법률 개정 이력 라인 | `> 법률 개정: 09-26 — ch5 1조 개정(...), PETITION_20260924` 1행 추가 (기존 09-02 라인 서식 준용) |

### 1-3. 불요 판정 (대조군으로 배제)

| 파일 | 판정 | 대조군 |
|------|------|--------|
| `monkos-ops/ops/templates/CONSTITUTION_ESSENCE.md` | **불요** — 헌법 축약본이며 배포 절차 미수록 | `grep "monk.kr\|CF Pages\|wrangler"` 0건. **대조군: 같은 파일 `배포` 2건 히트**(55·74행, 코웍이 역할·에센스 갱신 문장) → grep 유효 |
| `CLAUDE.md` 법률 인덱스(ch5 조 수) | **불요** — 조 신설 없음, ch5는 7조 유지 | 인덱스 표 `제5장 ... 7조` 실측 |
| `.claude/rules/makne-guard.md` | **불요** — CF·monk.kr 언급 0건 | 대조군: 같은 파일 `배포`·`ch5` 히트 있음. 단 **S2(ch7:111) 개정 시 발췌본 반영 여부 재확인 필요** |

---

## 2. 특별 심사 지점 판정

### 2-2. 시크릿 이원 운용 — 🔴 **관측 주체 부재**

**실측**

```bash
grep -n "gh \|github\|GitHub\|GH_" scripts/tools/secret_patrol.sh   # → 0건 (exit 1)
grep -c "gcloud" scripts/tools/secret_patrol.sh                     # → 1 (대조군: grep 유효)
grep -rln "만료\|expir" scripts/ .github/workflows/                  # → firestore_ttl·gsc_mcp·cdp_utils·node_modules 뿐 (시크릿 만료 추적 0)
gh secret list -R gdsajin-byte/monk_project                          # → 26건 (이름만)
```

**판정**

1. **순찰은 GCP SM + SA만 본다.** `secret_patrol.sh:19-22`가 스냅샷하는 것은 `secret.sh map`(=SM `gcloud`)과 `sa_audit.sh`뿐이다. GitHub Secrets는 스냅샷에 들어가지 않으므로, **SM과 GitHub이 어긋나도 diff에 나타나지 않는다.** 09-24 `gh secret set` 빈값 사고가 순찰로 잡히지 않은 것은 우연이 아니라 설계다.
2. **잡은 것은 워크플로 실패였다.** 빈값은 4차 실행 중 2차의 실패(run 35954389096)로 드러났다. 즉 현재 유일한 검출기는 **"배포를 시도해 보는 것"** 이다. 로테이션·만료 국면에서는 이 검출기가 곧 "다음 배포가 깨진다"는 뜻이다.
3. **만료 2027-09-24를 알리는 장치가 0개다.** SM annotation 문장과 SECRET_INVENTORY #45의 텍스트가 전부다. 만료 시 증상은 401/403 배포 실패 — 급하게 배포해야 하는 순간에 터진다.
4. **#39 CF_PAGES_TOKEN과 #45의 공존은 행정 부담으로 판정하지 않는다.** #39는 Pages:Edit + Workers Scripts:Edit(4060 SSG용), #45는 Pages:Edit 단일(CI 전용)이다. 최소권한 분리는 정당하며 인벤토리에 용도 분리가 병기돼 있다. 다만 **민아 자기교정(09-26 12:01)대로 발급 사유 서술이 틀렸던 점**은 §2-3 A3와 같은 뿌리다 — 인지 도구가 약해서 "없다"고 판단했다.

**권고 (조건 C4)**

- `secret_patrol.sh` 스냅샷에 `gh secret list --json name,updatedAt` 1줄 추가 → 이름·갱신일만 diff (값 미접촉, 순찰 원칙 유지).
- SECRET_INVENTORY에 `만료일` 열을 두고, 순찰이 **D-60 경고**를 발한다(장부 = PATROL_LOG.md).
- 이 2건은 "기계 집행 가능한데 조문으로만 남기지 않는다"(amendment.md)의 직접 적용 대상이다.

### 2-3. `secret add` 오안내 — 🔴 확정, 교정안 제시

**특정**: `scripts/secret.sh:161`

```
echo -e "${YELLOW}[인벤토리]${NC} 자동 맵이 반영한다 — 수기 추가 불필요 (secret map $NAME 으로 확인)"
```

**왜 틀렸나** — `cmd_map`(secret.sh:257-303)은 ① SM 실측 ② 인벤토리 **읽기**(`grep -m1 "| $NAME |" "$INVENTORY"`, 291행) ③ 소비처 `git grep`을 한다. **인벤토리에 쓰는 코드가 없다.** 즉 "자동 맵이 반영한다"는 것은 *인벤토리 파일이 갱신된다*는 의미로 읽히지만, 실제로는 *SM을 조회해 보여준다*는 뜻이다. 민아가 09-24 COMPLETION에 "인벤토리 자동 반영"이라 적은 오기의 출처가 바로 이 한 줄이다. 헌법 3조 4항(정본 단일) 관점에서 **인벤토리는 사람이 쓰는 정본**이고, 도구가 그 의무를 면제한다고 말하면 안 된다.

**교정안 (S12)**

```bash
echo -e "${YELLOW}[인벤토리]${NC} SM 등록은 끝났다. ${RED}SECRET_INVENTORY.md 메타 1행은 수기 추가 필수${NC} (이 스크립트는 인벤토리를 쓰지 않는다)"
echo -e "   확인: secret map $NAME  ← SM 실측 + 인벤 등재 여부만 표시"
echo -e "   GitHub Actions에서 쓸 값이면 ${RED}gh secret set $NAME${NC} 별도 필요 (SM↔GitHub 자동 동기 없음)"
```

3행째를 넣는 이유: 09-24 사고가 정확히 "SM에 넣었으니 끝났다"는 오인이었다. `secret.sh` 전체에 `gh` 언급이 **0건**(실측)이라 도구가 이원 운용을 아예 말해 주지 않는다.

### 2-4. 두 경로 간 드리프트 — 🟡 현재 일치, 구조적으로 벌어진다 / 🔴 스모크 공허

**실측 대조**

| 항목 | 경로① (로컬 수동) | 경로② (러너) | 판정 |
|------|------------------|--------------|------|
| 명령 | `npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true` (deploy-cf.md:25) | `wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true` (yml:45) | **인자 동일** ✅ |
| wrangler | `npx` → `node_modules/wrangler` **4.66.0** (실측) | `npm i -g wrangler@4.66.0` (yml:41) | **현재 동일**, 단 `package.json:10`은 `^4.66.0` **캐럿** vs 러너는 **정확 고정** → 재설치·타 기기에서 4.x 상향 시 **일방 드리프트** 🟡 |
| node | 로컬 **v24.12.0** / npm 11.6.2 | `setup-node@v4` **22** (yml:38-39) | 상이. npm 11의 npx 자동설치 거부가 1차 실패 원인이었음(yml:36 주석) 🟡 |
| CWD | 프로젝트 루트 (deploy-cf.md:10-13) | `actions/checkout@v4` 기본 = 워크스페이스 루트 | **동일** ✅ |
| `functions/` 정본 | 사람이 확인 (deploy-cf.md:15-19, **조문**) | `test -d functions && test ! -L functions` + `test ! -e MONK_kr/functions` (yml:23-27, **게이트**) | 경로②가 **더 강함** ✅ |
| 업로드 내용 | 워킹트리 그대로 (`--commit-dirty=true`로 dirty 경고 억제) | HEAD 신선 체크아웃 = **git 추적분만** | 경로②가 **구조적으로 안전** ✅ |
| 미커밋 게이트 (ch5 6조 게이트2) | **없음** | 해당 없음(HEAD만 배포) | monk.kr은 `deploy.sh`가 없어 **ch5 6조 적용 밖** 🟡 — 개정 시 적용 여부를 1행으로 명기할 것 |

**미추적 자산 실측** — `git status --porcelain MONK_kr/` = **0건**(청구안 4항 조문은 오늘 기준 충족). 단 `--ignored`로 보면 **4건**이 배포 루트에 남아 있다: `MONK_kr/.DS_Store`, `MONK_kr/ai_lab/.DS_Store`, `MONK_kr/_functions_backup_20260220/`(구 서버리스 소스 16본 — `auth.js`·`payment.js`·`tx.js`·`telegram.js` 포함), `MONK_kr/cloudflare-workers/`(15MB, `node_modules/.cache/wrangler/wrangler-account.json` 포함).

라이브 판정(2회 히트, 3경로 + **음성 대조군 2경로**): 4경로 전부 `200`이었으나 **음성 대조군 `/zzz_probe_nonexistent_20260926.js`도 200 + `content-type: text/html`** 이었고, `_functions_backup.../auth.js`·`wrangler-account.json`의 라이브 응답도 `text/html`(로컬 17,700B/110B와 불일치)이었다 → **파일이 서빙되는 것이 아니라 사이트 기본 HTML 폴백이다. 노출 없음으로 판정.** (1건 히트 ≠ 존재 — ch5 7조 대조군 의무)

**🔴 그 200이 스모크 게이트를 무력화한다.** `monk-kr.pages.dev` 실측:

```
https://monk-kr.pages.dev/                              → 200
https://monk-kr.pages.dev/zzz_probe_nonexistent...js    → 200   ← 없는 경로도 200
https://monk-kr.pages.dev/monk_studio/monk_studio       → 200
```

워크플로 스모크(yml:55-66)는 `[ "$code" = "200" ]`만 본다. **배포 URL이 살아 있으면 무조건 통과한다** — 파일이 빠졌든, 이미지가 폴백으로 떨어졌든, 09-19 쌍아가 실증한 "기본 HTML 200 → `onerror` 폴백" 사고가 그대로 재현돼도 초록불이다. ch5 6조 게이트4는 "실패 시 exit≠0"을 요구하는데, **실패할 수 없는 어서션은 게이트가 아니다**(무음 강등 금지).

**권고 (조건 C2)** — `edge/smoke_assert.txt` 선례를 그대로 차용해 **콘텐츠 어서션**으로 전환:

```bash
# 양성: 알려진 마커가 있어야 통과
curl -s -o /dev/null -A "$UA" "$DEPLOY_URL/monk_studio/monk_studio"
body=$(curl -s -A "$UA" "$DEPLOY_URL/monk_studio/monk_studio")
grep -q 'service_id\.jpg?v=' <<<"$body" || { echo "스모크 실패: 카드 이미지 마커 부재"; exit 1; }
# 이미지 실체: content-type이 image/*여야 한다 (200만으로 판정 금지)
ct=$(curl -s -D - -o /dev/null -A "$UA" "$DEPLOY_URL/monk_studio/images/service_id.jpg" | grep -i '^content-type' | tr -d '\r')
grep -qi 'image/' <<<"$ct" || { echo "스모크 실패: 이미지 미배포(폴백 HTML) — $ct"; exit 1; }
# 음성 대조군: 없는 경로가 200이어도 text/html이어야 하며, image/*면 어서션 자체가 무효
```

부수 적발(개정 범위 밖, 장부용): monk.kr은 **모든 없는 경로에 200 text/html**을 반환한다 → 구글 soft-404 취급 위험 + 상태코드 기반 검증이 전면 무효. `404.html` 부재 실측. 별건 처리 권고.

### 2-5. 운영 주체 — 🟡 **원문제(M2 5일 미배포)는 이 개정만으로 해소되지 않는다**

**실측**

```bash
gh repo view --json nameWithOwner,isPrivate,viewerPermission   # gdsajin-byte/monk_project, private, ADMIN
gh api repos/:owner/:repo/collaborators                        # gdsajin-byte 단독 (admin,maintain,pull,push,triage)
gh api .../actions/runs/35954533890                            # actor=gdsajin-byte, triggering_actor=gdsajin-byte, workflow_dispatch
gh auth status                                                 # iMac 로컬 gh = gdsajin-byte (repo 스코프)
gh api repos/.../environments                                  # total_count: 0
ssh m2 'command -v gh node npx wrangler'                       # gh=없음 node=없음 npx=없음 wrangler=없음 (KKU-MacMINI-M2)
```

**판정**

1. **버튼을 누를 수 있는 주체 = 작가님 GitHub 계정 단 하나.** `workflow_dispatch`는 저장소 **write 권한**을 요구하고, 협업자는 `gdsajin-byte` 1인뿐이다. 꾸에게는 계정 자체가 없다.
2. **M2(꾸)는 개정 후에도 자력 배포 불가.** 실측상 M2에 `gh`·`node`·`npx`·`wrangler` **4종 전부 부재**다. 경로②는 "wrangler 미설치"를 우회해 주지만, 트리거 수단(`gh` 또는 브라우저 + GitHub 계정)이 없으면 그만이다. 더구나 `kku-context.md:65`가 CF Pages 배포를 **꾸 접근 불가 영역**으로, 같은 파일 M2/쌍아 절이 "하지 않는 것: 서비스 배포"로 명문화하고 있다. 즉 **규정·계정·도구 3중으로 막혀 있고 이번 개정은 그중 무엇도 풀지 않는다.**
3. **그럼 무엇이 해소되나 — 실질 이득 2건.** ① 배포가 **기기·로컬 토큰 종속에서 분리**된다(작가님이 휴대폰 GitHub 앱/웹에서 Run 가능. 09-24 이전에는 iMac 세션 + 로컬 CF 자격이 필요했다). ② 러너가 **git 추적분만** 올리므로 09-24 "배포자 디스크가 라이브를 결정" 사고가 재발 불가. 원문제의 진짜 병목은 "M2가 배포 못 함"이 아니라 **"배포할 수 있는 창구가 iMac 에이전트 세션 하나였음"** 이고, 그 병목은 해소된다.
4. **🔴 감사 식별 불가.** run의 `actor`/`triggering_actor`가 **항상 `gdsajin-byte`** 다. 작가님의 버튼 클릭과 에이전트의 `gh workflow run`이 GitHub 기록상 **구별되지 않는다**. 청구안이 "작가님 승인을 세션 로그에 기록한 에이전트"를 허용하므로, 감사 앵커가 전적으로 **자기신고형 세션 로그**에 놓인다. ch1 7조 2항("같은 응답 블록 내 자가 생성 승인은 승인이 아님")이 조문 집행에 불과하다고 스스로 한계를 인정한 그 지점이다.
5. **기계 집행이 0이다.** `.claude/settings.json`의 `permissions.allow`는 `Bash(*)`, `deny`는 파괴적 5종뿐 — `gh workflow run`·`wrangler pages deploy` 어느 것도 걸리지 않는다(실측, `workflow` 0건).

**권고 (조건 C3) — 승인 앵커를 세션 로그 밖으로 옮긴다. 아래 중 1택 이상**

- **(권장) GitHub Environment 보호** — 워크플로에 `environment: production` + required reviewer(작가님). 승인이 **GitHub run 기록에 독립적으로** 남아 자기신고 의존이 사라진다. ⚠️ 환경 API는 응답하나(`total_count: 0`) private 저장소의 보호 규칙은 유료 플랜이 필요하다 — **플랜 미확인(토큰 스코프상 미노출), 작가님 확인 필요.**
- **`reason` 입력 서식 강제** — `reason`을 `{YYYY-MM-DD HH:MM KST} {디바이스}/{에이전트} · 승인수신 {HH:MM} · {사유}` 로 규정하고 워크플로가 정규식 검증 후 불일치 시 exit 1. 무료로 가능하며 run 목록만 봐도 주체가 드러난다.
- **`.claude/settings.json` deny에 `Bash(gh workflow run:*)` 추가** — 에이전트 경로를 원천 차단하고 트리거를 작가님 직접 행위(버튼 또는 세션 내 `! gh workflow run`)로 한정. 청구안이 허용한 "승인 수신 에이전트 실행"을 포기하는 대가로 감사가 깔끔해진다. **작가님 선택 사항.**

---

## 3. 조항별 표결

| 조문안(청구안 §3) | 표결 | 사유 |
|---|---|---|
| ① 자동빌드 OFF·`배포 ≠ push` 유지 | **찬성** | 02-20 원취지 그대로. 워크플로에 `push` 트리거 부재 실측(yml:5-11) |
| ② 배포 = 승인자 트리거만 (경로 ①②, push 트리거 금지) | **조건부 찬성** | **C1**(ch7:111 동시 개정) **C2**(스모크 콘텐츠 어서션 전환) **C3**(승인 앵커 1택) 충족 시. 미충족 시 **반대** — ②를 선언하면서 ch7이 같은 행위를 자유 범위로 두는 상태는 "안 읽힌 법"을 1건 더 만든다 |
| ③ 표준 명령·CWD·`functions` 정본 유지 | **조건부 찬성** | **C5**: `package.json:7` 비정본 스크립트 정리 + `package.json:10` 캐럿(`^4.66.0`)과 러너 고정(4.66.0)의 정합 방침 1행. 미조치 시 조문상 "표준 명령 1개"인데 실제 진입점 3개가 남는다 |
| ④ 배포 산출물 = git 추적 파일만 / 미추적 자산 금지 | **조건부 찬성** | **C6**: **적용 범위를 monk.kr(CF Pages)로 한정 명기.** 일반화하면 ch5 6조 게이트3("gitignore 산출물 해시 제외")과 portal SSG 산출물 운용과 정면 충돌한다. 아울러 `MONK_kr/` 미추적 0건이나 gitignore 4건(`_functions_backup_20260220/` 구 서버리스 소스 16본 포함)이 배포 루트에 잔존 — 라이브 노출은 부재로 판정했으나 **경로① 존속 시 상시 리스크**이므로 정리 권고 |
| 청구안 §4 영향 목록(2건) | **보정 필요** | 필수 13건(§1-1). 특히 `rules/deployment.md`는 "1행 동기화"가 아니라 **절 신설**이며, `live-verify.md` 스탬프 전이가 누락됐다 |
| 부대 — 시크릿 행정 | **조건부** | **C4**: 순찰의 GitHub Secrets 관측 + 만료 D-60 경고. 미조치 시 로테이션 검출기가 "다음 배포 실패"뿐 |
| 부대 — 도구 인지 | **조건부** | **C7**: `references.md` 도구 맵 등재(3요건 #1) + `secret.sh:301` `*.yml` 추가(S11). 후자는 1토큰 수정으로 Actions 소비처 전체가 보이게 된다 |

**종합**: **조건부 찬성 — 조건 C1~C7.** C1·C2는 개정과 **동시 집행**을 요구한다(둘 다 미조치 시 반대로 전환). C3는 작가님 1택 사항. C4~C7은 개정 후 14일 내 이행으로 갈음 가능.

---

## 4. 실측 명령 부록

```bash
# 조문·동기화
grep -n "" governance/laws/ch5_deployment.md | sed -n '8,20p'
grep -n "wrangler\|CF Pages\|monk.kr" governance/laws/ch7_makne_code.md
grep -n "monk.kr\|wrangler\|CF Pages" .claude/rules/deployment.md ; grep -c "deploy.sh" .claude/rules/deployment.md   # 0건 + 대조군 7
grep -c "github\|workflow\|Actions" .claude/rules/references.md                                                      # 0
for f in .claude/rules/*.md; do grep -m1 '^> source: ' $f; done
sed -n '71,97p' .github/workflows/governance-check.yml       # C10: 무스탬프 파일은 continue로 무음 스킵

# 시크릿
grep -n "gh \|github\|GitHub" scripts/tools/secret_patrol.sh ; grep -c gcloud scripts/tools/secret_patrol.sh   # 0 / 1(대조군)
sed -n '299,303p' scripts/secret.sh                          # pathspec에 '*.yml' 없음
git grep -ln CF_PAGES_DEPLOY_TOKEN | head                    # 대조군: .yml 히트
gh secret list -R gdsajin-byte/monk_project | wc -l          # 26
zsh scripts/secret.sh map CF_PAGES_DEPLOY_TOKEN              # 소비처에 워크플로 미표시(=S11 증거)

# 경로 드리프트
npx wrangler --version ; node -v ; npm -v                    # 4.66.0 / v24.12.0 / 11.6.2
grep -n "wrangler\|\"deploy\"" package.json
git status --porcelain MONK_kr/ | wc -l                       # 0
git status --porcelain --ignored MONK_kr/ | grep -c '^!!'     # 4

# 라이브 (2회 히트 + 음성 대조군 + content-type 실체 대조)
UA="Mozilla/5.0 monkos-audit"
for p in "/" "/zzz_probe_nonexistent_20260926.js" "/_functions_backup_20260220/api/auth.js"; do
  curl -s -o /dev/null -A "$UA" "https://monk.kr$p"
  curl -s -D - -o /dev/null -A "$UA" "https://monk.kr$p" | grep -iE '^(HTTP|content-type)'
done
for u in / /zzz_probe_nonexistent_20260926.js /monk_studio/monk_studio; do
  curl -s -o /dev/null -A "$UA" "https://monk-kr.pages.dev$u"
  echo "$u → $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "https://monk-kr.pages.dev$u")"
done

# 권한·주체
gh repo view --json nameWithOwner,isPrivate,viewerPermission
gh api repos/:owner/:repo/collaborators --jq '.[].login'
gh api repos/gdsajin-byte/monk_project/actions/runs/35954533890 --jq '{actor:.actor.login,triggering:.triggering_actor.login}'
gh api repos/gdsajin-byte/monk_project/environments
ssh -o BatchMode=yes m2 'for c in gh node npx wrangler; do printf "%s=%s\n" "$c" "$(command -v $c || echo 없음)"; done'
```

**판정 방법 고지**: 라이브 판정은 전부 URL당 2회 히트(1차 폐기·2차 판정) + 음성 대조군 + `content-type`/바이트 실체 대조로 수행했다(ch5 7조). 워크플로는 **실행하지 않았다** — `gh run list`/`gh api` 조회만 사용(ORDER 준수 조항). 시크릿은 값 미접촉(`secret map`/`gh secret list` 이름·메타만).

---

**결론**: **조건부 찬성 (C1~C7).** 개정 방향은 옳고, 경로②는 09-24 사고 계열을 구조적으로 닫는다. 다만 이 개정은 **없던 문제를 만들지는 않는 대신, 이미 있던 행정 공백 4건(ch7 충돌·공허한 스모크·GitHub Secrets 무관측·`secret map` yml 실명)을 라이브 배포 경로 위에 올려놓는다.** C1·C2를 개정과 같은 커밋에 넣는 것을 강하게 권고한다.
