# Looper
Turn any HLS video into an endless loop so you can test live streaming
in the browser without running any infrastructure.

If you're testing or demoing something that needs a live stream in a
web browser, `looper` transforms an HLS video into a never-ending loop
through the magic of [Service
Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API). Show
off live experiences without the hassle and cost of running a 24/7
live service.

## Installation and Usage
Looper is packaged as a Javascript module and available through npm:

```sh
npm install @dmlap/looper
```

There are two steps to transform your video into a live stream from
here: installing the Service Worker and then registering it inside
your page.

[Service Workers must be served from the same
domain](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#why_is_my_service_worker_failing_to_register)
and be at least as high up in the path as the video you're
streaming. So if the video you're looping is at
`https://example.com/movies/example.m3u8`, `loop-worker.mjs` could be
loaded from `https://example.com/loop-worker.mjs` or
`https://example.com/movies/loop-worker.mjs`. If you want to keep
things simple, just drop it at the root of your domain.

Then, import `looper.mjs` into the code running on your page or
include it directly as a `script` element:

```html
<script type="module" src="looper.mjs"></script>
<video src="example.m3u8" controls></video>
```

## Contributing

PRs accepted.

If you're making changes to looper and testing them with Safari, you
may have to close _every_ tab looper is loaded in to trigger a
re-install of the ServiceWorker.

## License

Apache 2
