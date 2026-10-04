const SampleWindow = 8

type Sample = { offset: number; rtt: number }

export class ClockSync {
  private samples: Sample[] = []
  private best?: Sample

  get offset(): number | undefined {
    return this.best?.offset
  }

  get rtt(): number | undefined {
    return this.best?.rtt
  }

  addRoundTrip(sentAt: number, receivedAt: number, serverTime: number): number {
    const rtt = Math.max(0, receivedAt - sentAt)
    const offset = serverTime + rtt / 2 - receivedAt
    this.samples.push({ offset, rtt })
    if (this.samples.length > SampleWindow) this.samples.shift()
    this.best = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a))
    return this.best.offset
  }
}
