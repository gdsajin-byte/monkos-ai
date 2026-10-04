export type Snapshot = {
  at: string
  sessions: string[]
  todayLogs: string[]
  pendingOrders: string[]
  pfRows: string[]
  git: string
  tokenCount: number
  errors: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'control-room': {
      snapshot: Snapshot | null
      pf: string
      lastAction: string
    }
  }
}
