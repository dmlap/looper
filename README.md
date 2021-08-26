# Looper
Turn any HLS video into an endless loop so you can test live streaming
in the browser without running any infrastructure.

If you're testing or demoing something that needs a live stream in a
web browser, `looper` transforms an HLS video into a never-ending loop
through the magic of service workers. Show off live experiences
without the hassle and cost of running a 24/7 live service.

## Installation and Usage
Looper is packaged as a Javascript module and available through npm:

```sh
npm install @dmlap/looper
```

Then drop it into the web page you'll be playing your live stream from:

```html
<video src="example.m3u8" controls></video>
<script type="module" src="looper.mjs"></script>
```

## Contributing

PRs accepted.

If you're making changes to looper and testing them with Safari, you
may have to close _every_ tab looper is loaded in to trigger a
re-install of the ServiceWorker.
## License
Apache 2
