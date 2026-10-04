# mods-approve-button — 모드 승인 버튼 시범 (실행 경로 아님)

> ORDER_20261004 모드승인버튼 시범실측 산출물. **운영 미반영.** 실 승인 디렉터리 `.claude/approvals/` 미접촉.
> 결과: `monkos-ops/ops/reports/2026-10/REPORT_20261004_iMac쌍아-막내2_모드승인버튼_실측.md`

## 무엇을 하나

- 프롬프트 위 밴드(`ui.render` AbovePrompt)에 `[모의 E10] 상태 [ 배포 승인(모의) ]` 버튼을 그린다.
- 버튼 클릭(`ui.press`) → 세션 cwd 기준 `mock_approvals/<session_id>.token` 에 JSON(세션 ID·nonce·발급·만료 10분·surface) 기록.
- `tool.call` 훅: 도구 인자 직렬화에 `mock_approvals` 문자열이 있으면 deny (guard_write 모의).

## 로딩 (그 프로세스에만)

반드시 **스크래치 디렉터리를 cwd로** 띄운다(토큰이 cwd 기준 상대경로에 쓰인다).

```bash
cp -R scripts/tools/_trial/mods-approve-button "$SCRATCH/plugin/"   # 로딩 시 .claude-plugin/types/ 가 생성되므로 사본 사용
cd "$SCRATCH" && claude --plugin-dir "$SCRATCH/plugin/mods-approve-button"
claude plugin validate scripts/tools/_trial/mods-approve-button      # 정적 검사
```

버튼 누르기: `ctrl+x` → `Tab`(밴드 포커스) → `Enter`, 또는 클릭. hotkey는 일부러 두지 않았다(빈 프롬프트의 숫자키가 밴드 버튼을 누르는 규칙 회피).

## 한계 (실측으로 확인됨)

- **키 입력 주입에 뚫린다**: 같은 머신의 모델이 `tmux send-keys`(또는 osascript)로 `C-x Tab Enter`를 보내면 정식 토큰이 발급된다 — `ui.press`에는 출처(사람/주입) 구분 필드가 없다.
- **문자열 매칭 deny는 경로 분할로 뚫린다**: `m=mock_; a=approvals; echo > ./$m$a/x.token` 통과.
- 토큰을 파일로 두는 한 위조 표면이 남는다. 개선 방향은 보고서 §5.
