export default class LoopClient {
  constructor (scriptUrl = 'loop-worker.mjs') {
    this._scriptUrl = scriptUrl
  }

  register () {
    return navigator.serviceWorker.register(this._scriptUrl)
  }
}
