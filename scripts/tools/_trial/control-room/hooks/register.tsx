// MONK 컨트롤 룸 PoC (ORDER_20261004 컨트롤룸_PoC, 쌍아 11:41 범위 축소: P1·P2만).
// P1 상황판 — 읽기 전용 조회. P2 발동 버튼 — 스킬 명령을 프롬프트로 넣거나 실행.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Snapshot } from '../types'

const PANE = 'control-room'
const REFRESH_MS = 60 * 1000
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const LAUNCHERS = ['/pf-status', '/health-check', '/session-checkpoint']

const snapshot = atom({ plugin: 'control-room', key: 'snapshot' } as const, null)
const pf = atom({ plugin: 'control-room', key: 'pf' } as const, '')
const lastAction = atom({ plugin: 'control-room', key: 'lastAction' } as const, '')

const kst = (ms: number) => new Date(ms + KST_OFFSET_MS).toISOString().replace('T', ' ').slice(0, 16)

let pfNames: string[] = []

async function list($: any, dir: string): Promise<string[]> {
    try {
      return (await $.fs.list(dir)).map((x: { name: string }) => x.name)
    } catch {
      return []
    }
}

async function collect($: any): Promise<Snapshot> {
    const stamp = kst(await $.clock.now())
    const day = stamp.slice(0, 10)
    const month = day.slice(0, 7)
    const errors: string[] = []

    let sessions: string[] = []
    try {
      const r = await $.process.run(['claude', 'agents', '--json'], { timeoutMs: 15000 })
      const data = JSON.parse(r.stdout)
      const rows: any[] = Array.isArray(data) ? data : data.sessions ?? data.agents ?? []
      sessions = rows.map(s => [s.name ?? s.title ?? s.id, s.status ?? s.state].filter(Boolean).join(' · '))
    } catch (err) {
      errors.push(`세션 조회 실패: ${String(err).slice(0, 100)}`)
    }

    const todayLogs = (await list($, `monkos-ops/ops/sessions/${month}`)).filter(n => n.startsWith(day))

    // 수신 확인 안 된 지시서(추정): status 발행 + 같은 수신자 이름과 내용 낱말 하나를 공유하는 보고 파일 부재
    const reports = (await list($, `monkos-ops/ops/reports/${month}`)).filter(n => /^(COMPLETION|REPORT)_/.test(n))
    const pendingOrders: string[] = []
    for (const name of await list($, `monkos-ops/ops/orders/${month}`)) {
      if (!name.startsWith('ORDER_')) continue
      try {
        const head = (await $.fs.read(`monkos-ops/ops/orders/${month}/${name}`)).slice(0, 600)
        if (!/^status:\s*발행/m.test(head)) continue
        const parts = name.replace(/\.md$/, '').split('_').slice(2)
        const to = parts[1] ?? ''
        const words = parts.slice(2).filter(w => /[가-힣]/.test(w) && w.length >= 2)
        const done = reports.some(r => r.includes(to) && words.some(w => r.includes(w)))
        if (!done) pendingOrders.push(name.replace(/\.md$/, ''))
      } catch (err) {
        errors.push(`지시서 읽기 실패 ${name}`)
      }
    }

    // 오늘 PF 히스토리 행(전 PF), 최근 3
    pfNames = (await list($, 'monkos-ops/ops/portfolios')).filter(n => n.startsWith('PF_'))
    const short = `${day.slice(5, 7)}/${day.slice(8, 10)}`
    const pfRows: string[] = []
    for (const p of pfNames) {
      try {
        const text = await $.fs.read(`monkos-ops/ops/portfolios/${p}/README.md`)
        for (const line of text.split('\n')) {
          if (line.startsWith(`| ${day} |`) || line.startsWith(`| ${short} |`)) pfRows.push(`${p}: ${line.slice(0, 110)}`)
        }
      } catch {
        // README 없는 PF 폴더는 건너뛴다
      }
    }

    let git = ''
    try {
      const r = await $.process.run(['git', 'status', '-sb', '--porcelain'])
      const lines = r.stdout.split('\n').filter(Boolean)
      git = `${lines[0] ?? ''} · 미커밋 ${Math.max(0, lines.length - 1)}`
    } catch (err) {
      errors.push(`git 조회 실패: ${String(err).slice(0, 100)}`)
    }

    const tokenCount = (await list($, '.claude/approvals')).filter(n => n.endsWith('.token')).length

    return { at: stamp, sessions, todayLogs, pendingOrders, pfRows: pfRows.slice(-3), git, tokenCount, errors }
}

async function refresh($: any) {
    try {
      const s = await collect($)
      await update($, snapshot, () => s)
    } catch (err) {
      $.ui.toast(`컨트롤 룸 갱신 실패: ${String(err).slice(0, 80)}`)
    }
}

async function launch($: any, text: string, mode: 'fill' | 'submit') {
    if (mode === 'fill') {
      const r = await $.prompt.fill({ text })
      await update($, lastAction, () => `${text} → 입력창 삽입 ${r.isFilled ? '성공' : '실패'}`)
    } else {
      // $.prompt.submit은 '/'로 시작하는 텍스트를 거부한다(실측) → 모델에게 스킬 실행을 요청하는 문장으로 제출
      const ask = `${text.slice(1)} 스킬을 실행하라 (컨트롤 룸 버튼 요청)`
      await $.prompt.submit({ text: ask })
      await update($, lastAction, () => `${text} → 실행 요청 제출`)
    }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'control', description: '컨트롤 룸 패널 열기' })
    void refresh($)
    $.clock.every(REFRESH_MS, () => void refresh($))
    return started
  })

  on('command.run', { command: 'control' }, async $ => {
    await $.ui.open({ id: PANE, title: 'MONK 컨트롤 룸' })
    void refresh($)
    return { text: '컨트롤 룸 패널을 열었다.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Select } = $.ui.resolve(e) as any
    const s = await read($, snapshot)
    const chosen = await read($, pf)
    const action = await read($, lastAction)

    const section = (title: string, rows: string[], empty: string) => (
      <Box flexDirection="column">
        <Text bold>{title}</Text>
        {rows.length === 0 ? <Text dimColor>  {empty}</Text> : rows.map(r => <Text>  {r}</Text>)}
      </Box>
    )

    return (
      <Box flexDirection="column">
        <Text bold>P1 상황판 {s ? `(${s.at} KST, 60초 주기)` : '(수집 중)'}</Text>
        <Button key="refresh" label="갱신" hotkey="r" onPress={() => refresh($)} />
        {s && section('세션', s.sessions, '없음')}
        {s && section('오늘 세션 로그', s.todayLogs, '없음')}
        {s && section('미수신 추정 지시서', s.pendingOrders, '없음')}
        {s && section('오늘 PF 행(최근 3)', s.pfRows, '없음')}
        {s && <Text>git: {s.git || '조회 실패'}</Text>}
        {s && <Text>승인 토큰 파일: {s.tokenCount}개 (개수만)</Text>}
        {s && s.errors.map(x => <Text color="red">⚠ {x}</Text>)}
        <Text bold>P2 발동</Text>
        {LAUNCHERS.map((cmd, i) => (
          <Box>
            <Text>{cmd} </Text>
            <Button key={`fill${cmd}`} label="삽입" hotkey={String(i * 2 + 1)} onPress={() => launch($, cmd, 'fill')} />
            <Button key={`run${cmd}`} label="실행" hotkey={String(i * 2 + 2)} onPress={() => launch($, cmd, 'submit')} />
          </Box>
        ))}
        <Box>
          <Select
            key="pf"
            label="PF "
            options={(pfNames.length ? pfNames : ['PF_MONK_OS']).map(n => ({ value: n, label: n }))}
            value={chosen || undefined}
            onSelect={v => update($, pf, () => v)}
          />
          <Button
            key="declare"
            label="선언"
            hotkey="d"
            onPress={() => launch($, `/pf-declare ${chosen || 'PF_MONK_OS'}`, 'fill')}
          />
        </Box>
        {action ? <Text dimColor>마지막: {action}</Text> : null}
      </Box>
    )
  })
}
