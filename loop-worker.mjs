/* eslint-env worker */

import HLSLoop from './src/hls-loop.mjs'

const loops = new Map()

self.addEventListener('fetch', (event) => {
  const request = new Request(event.request, {
    mode: 'cors',
    credentials: 'same-origin'
  })
  event.respondWith(fetch(request).then(async (response) => {
    const contentType = response.headers.get('Content-Type')

    if (/application\/vnd\.apple\.mpegurl/i.test(contentType)) {
      let loop = loops.get(request.url)

      if (!loop) {
        const m3u8 = await response.text()
        loop = new HLSLoop(m3u8)
        loops.set(request.url, loop)
      }

      return new Response(loop.render(), {
        status: 200,
        headers: {
          ...response.headers,
          'Cache-Control': 'max-age=0'
        }
      })
    }

    return response
  }))
})
