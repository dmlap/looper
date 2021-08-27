/* eslint-env worker */

import HLSLoop from './src/hls-loop.mjs'

const loops = new Map()

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') {
    // only process GET requests
    return
  }

  event.respondWith(fetch(request).then(async (response) => {
    const contentType = response.headers.get('Content-Type')

    if (!/application\/vnd\.apple\.mpegurl/i.test(contentType)) {
      // return unmodified responses for non-playlist requests
      return response
    }

    let loop = loops.get(request.url)

    if (!loop) {
      // create and cache a loop for every new playlist URL
      // encountered
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
  }).catch((error) => {
    console.error('Looper fetch error', request.method, request.url, error)
  }))
})
