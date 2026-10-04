// 시범 전용 (ORDER_20261004 모드승인버튼). 실 승인 디렉터리(.claude/approvals) 미접촉.
// 토큰은 세션 작업 디렉터리 기준 mock_approvals/ 에만 쓴다 — 스크래치 cwd에서 기동할 것.
import type { Register } from 'claude-code'

const MOCK_DIR = 'mock_approvals'
const TTL_MS = 10 * 60 * 1000

export const register: Register = on => {
  let issued = ''

  // 모델의 토큰 직접 기록 차단 (guard_write의 approvals deny 모의).
  // 도구 인자는 e에 평탄하게 실린다(e.file_path, e.command) — e.input 아님.
  // 문자열 매칭이라 경로 우회(cd mock_*, 변수 조립)에는 뚫린다: 시범의 한계.
  on('tool.call', async ($, e, next) => {
    if (JSON.stringify(e).includes(MOCK_DIR)) {
      return { deny: 'mods-approve-button: mock_approvals 는 버튼만 쓴다' }
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text dimColor>[모의 E10] {issued ? `발급됨 ${issued} ` : '미발급 '}</Text>
        <Button
          key="approve"
          label="배포 승인(모의)"
          variant="primary"
          onPress={async () => {
            const sid = await $.session.id()
            const now = await $.clock.now()
            const token = {
              session_id: sid,
              nonce: crypto.randomUUID(),
              issued_at: new Date(now).toISOString(),
              expires_at: new Date(now + TTL_MS).toISOString(),
              source: 'ui.press',
              surface: e.surface,
            }
            await $.fs.write(`${MOCK_DIR}/${sid}.token`, JSON.stringify(token, null, 2) + '\n')
            issued = token.issued_at
            $.ui.toast('모의 승인 토큰 발급')
            $.ui.invalidate('ui.render')
          }}
        />
      </Box>
    )
  })
}
