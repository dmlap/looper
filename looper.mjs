navigator.serviceWorker.register('loop-worker.mjs').then((registration) => {
  console.log('looper registered')
}).catch((error) => {
  console.error('looper registration error', error)
})
