type SyncSample = { offset: number; rtt: number }

export class ClockSync {
  private offset = 0
  private samples: SyncSample[] = []
  private pendingSendTime = 0
  private pendingResolve: ((offset: number) => void) | null = null

  requestSync(socket: WebSocket): Promise<number> {
    this.pendingSendTime = Date.now()
    socket.send(JSON.stringify({ type: "sync" }))
    return new Promise((resolve) => {
      this.pendingResolve = resolve
    })
  }

  handleMessage(data: unknown, recvTime: number): boolean {
    if (typeof data !== "object" || data === null) return false
    const msg = data as Record<string, unknown>
    if (msg?.type !== "sync") return false
    if (this.pendingSendTime === 0) return true

    const rtt = recvTime - this.pendingSendTime
    const serverTime = new Date(msg.serverTime as string).getTime()
    if (isNaN(serverTime)) return true

    const offset = this.pendingSendTime + rtt / 2 - serverTime

    this.samples.push({ offset, rtt })
    if (this.samples.length > 10) this.samples.shift()

    const best = this.samples.reduce((a, b) => (a.rtt < b.rtt ? a : b))
    this.offset = best.offset

    this.pendingResolve?.(this.offset)
    this.pendingResolve = null
    return true
  }

  getOffset(): number {
    return this.offset
  }

  getEstimatedServerTime(): number {
    return Date.now() - this.offset
  }
}
