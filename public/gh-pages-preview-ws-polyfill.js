const worker = new Worker('./dist/worker.js', { type: 'module' })

const instances = []

const RealWebSocket = WebSocket
self.WebSocket = class FakeWebSocket {
  static OPEN = RealWebSocket.OPEN
  OPEN = RealWebSocket.OPEN
  readyState = RealWebSocket.OPEN
  constructor () {
    instances.push(this)
    queueMicrotask(() => this.onopen?.())
  }

  send (massage) {
    worker.postMessage(massage)
  }
}

worker.addEventListener('message', e => {
  for (const ws of instances) {
    ws.onmessage?.(e)
  }
})


