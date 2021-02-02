/* eslint-env worker */
import M3u8Codec from '@adventr/m3u8-codec/dist/m3u8-codec.js'

self.addEventListener('fetch', (event) => {
  console.log(`proxying ${event.request.url}`)
  event.respondWith(fetch(event.request).then((response) => {
    console.log(`proxied: ${response.ok}`)
    return response
  }))
})
