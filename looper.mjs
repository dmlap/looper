import LoopClient from './src/loop-client.mjs'

new LoopClient().register().catch((error) => {
  console.error('Failed to register looper', error)
})
