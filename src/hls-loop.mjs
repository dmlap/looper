import M3U8Codec from '@adventr/m3u8-codec/dist/m3u8-codec.js'
const { codecs: { M3U8NestedCodec } } = M3U8Codec

function cloneM3u8 (m3u8) {
  const result = { ...m3u8 }
  result.segments = result.segments.map((segment) => {
    return segment.map((tag) => {
      return { ...tag }
    })
  })
  result.globals = result.globals.map((tag) => {
    const result = { ...tag }
    if (Object(tag.value) === tag.value) {
      // clone value objects
      tag.value = { ...tag.value }
    }
    return result
  })
  return result
}

function tagByName (name) {
  return (tag) => {
    return tag.name === name
  }
}

export default class HLSLoop {
  constructor (m3u8, startTime = new Date()) {
    this._codec = new M3U8NestedCodec()
    this._m3u8 = this._codec.parse(m3u8)
    this._m3u8.globals = this._m3u8.globals.filter((line) => {
      return line.name !== '#EXT-X-ENDLIST'
    })
    this._startTime = +startTime

    // aggregate segment timing information
    // the duration of the entire playlist
    this._totalDuration = 0
    // the cumulative end time in seconds for each segment
    this._endTimes = []

    this._contexts = []
    let runningContext = new Map([
      ['#EXT-X-MAP', null], ['#EXT-X-KEY', null]
    ])
    for (const segment of this._m3u8.segments) {
      for (const tag of segment) {
        if (tag.name === '#EXTINF') {
          // sum up segment durations
          this._totalDuration += tag.value.duration

          // save the endtime of the segment in the original timeline
          this._endTimes.push(this._totalDuration)
        } else if (runningContext.has(tag.name)) {
          runningContext = new Map(runningContext)
          runningContext.set(tag.name, tag)
        }
      }
      this._contexts.push(runningContext)
    }
    // // the context explicitly declared on the first segment
    // this._startContexts = collectContext(this._m3u8.segments, 1)
    // // the index of the last declaration for tags that are implicitly
    // // applied to all subsequent segments
    // this._endContexts = collectContext(
    //   this._m3u8.segments, this._m3u8.segments.length
    // )
  }

  render () {
    return this._render((+new Date() - this._startTime) * 0.001)
  }

  _render (seconds) {
    const result = cloneM3u8(this._m3u8)
    if (seconds < this._endTimes[0]) {
      // too soon to start looping
      return result
    }

    const loop = Math.floor(seconds / this._totalDuration)
    const time = seconds % this._totalDuration
    const currentIx = Math.max(0, this._endTimes.findIndex((endTime) => {
      return endTime > time
    }))
    // update discontinuity sequence
    const discSeq = result.globals.find(
      tagByName('#EXT-X-DISCONTINUITY-SEQUENCE')
    )
    discSeq.value = loop
    // update media sequence
    result.globals.find(
      tagByName('#EXT-X-MEDIA-SEQUENCE')
    ).value = loop * result.segments.length + currentIx

    // rotate contextual segment declarations (e.g. EXT-X-MAP)
    // we have to explicitly declare context for the first segment and
    // the split point if their running context would be changed by
    // the rotation
    // Note: object identity is used for comparisons below so keep in
    // mind `this._contexts` comes from `this._m3u8` and `result` is a
    // deep clone
    // first, the split point
    for (const [name, tag] of this._contexts[currentIx]) {
      if (tag !== null && !result.segments[currentIx].find(tagByName(name))) {
        // make the context declaration explicit
        result.segments[currentIx].unshift(tag)
      }
    }
    // then, the first segment
    for (const [name, tag] of this._contexts[this._contexts.length - 1]) {
      const computedStartTag = this._contexts[0].get(name)
      const startTagIx = this._m3u8.segments[0].findIndex(tagByName(name))
      const startTag = this._m3u8.segments[0][startTagIx]
      if (!startTag && computedStartTag !== tag) {
        result.segments.unshift(result.segments[0][startTagIx] || {
          name,
          type: tag.type
          // `value` ignored to "unset" the tag
        })
      } else if (startTag && startTag === tag) {
        // remove duplicate declarations
        result.segments[0].splice(startTagIx, 1)
      }
    }

    if (currentIx !== 0) {
      // push a discontinuity if the original first segment is
      // currently rotated out of the first position
      result.segments[0].unshift({
        name: '#EXT-X-DISCONTINUITY',
        playlistType: 'media',
        appliesToNextUri: true
      })
    }

    // rotate segments
    result.segments = [
      ...result.segments.slice(currentIx),
      ...result.segments.slice(0, currentIx)
    ]
    return this._codec.stringify(result)
  }
}
