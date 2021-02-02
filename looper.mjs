navigator.serviceWorker.register('loop-worker.mjs').then((registration) => {
  console.log(registration)
}).catch((error) => {
  console.error(error)
})
