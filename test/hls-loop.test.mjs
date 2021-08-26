/* eslint-env mocha */
import HLSLoop from '../src/hls-loop.mjs'
import assert from 'assert'

const example = [
  '#EXTM3U',
  '#EXT-X-MAP:URI="init.mp4"',
  '#EXTINF:10,', 'index0.m4s',
  '#EXTINF:5,', 'index1.m4s',
  '#EXTINF:2,', 'index2.m4s',
  '#EXTINF:10,', 'index3.m4s',
  '#EXTINF:10,', 'index4.m4s',
  '#EXTINF:10,', 'index5.m4s',
  '#EXT-X-ENDLIST'
]
const tags = {
  discSeq: /^#EXT-X-DISCONTINUITY-SEQUENCE:(\d*)$/,
  disc: /^#EXT-X-DISCONTINUITY$/,
  map: /^#EXT-X-MAP:URI="([^"]*)"/,
  mediaSeq: /^#EXT-X-MEDIA-SEQUENCE:(\d*)$/,
  segment: /^[^#].*$/
}

function matchTag (tag) {
  return (line) => { return tag.exec(line) }
}

describe('HLS loop', () => {
  it('strips EXT-X-ENDLIST', () => {
    const looper = new HLSLoop(example.join('\n'))

    let actual = looper._render().split('\n')
    assert.notEqual(actual.slice(-1)[0], example.slice(-1)[0])

    // zero seconds has identical behavior
    actual = looper._render(0).split('\n')
    assert.notEqual(actual.slice(-1)[0], example.slice(-1)[0])
  })

  it('preserves segments and ordering', () => {
    const looper = new HLSLoop(example.join('\n'))

    const actual = looper._render().split('\n')
    assert.deepStrictEqual(actual.slice(-5 * 2), example.slice(-5 * 2 - 1, -1))
  })

  it('rotates segments and inserts a discontinuity', () => {
    const looper = new HLSLoop(example.join('\n'))

    const actual = looper._render(10).split('\n')
    const discSeqs = actual.map(matchTag(tags.discSeq)).filter((match) => {
      return match && match[1]
    })
    assert.equal(discSeqs.length, 1, 'discontinuity tag')
    const discSeq = parseInt(discSeqs[0][1], 10)
    assert.strictEqual(discSeq, 0, 'disc sequence number')

    const segments = actual.filter(matchTag(tags.segment)).map((line) => {
      return parseInt(line.slice(5, 6), 10)
    })
    assert.deepStrictEqual(segments, [1, 2, 3, 4, 5, 0], 'segment order')

    const discIx = actual.findIndex(matchTag(tags.disc))
    assert.strictEqual(discIx, actual.length - 1 - (2 * 1), 'discontinuity tag index')

    const mediaSeq = matchTag(tags.mediaSeq)(actual.find(matchTag(tags.mediaSeq)))
    assert.strictEqual(parseInt(mediaSeq[1], 10), 1, 'media sequence')
  })

  it('rotates segments based on their duration', () => {
    const looper = new HLSLoop(example.join('\n'))

    const actual = looper._render(20).split('\n')
    const segments = actual.filter(matchTag(tags.segment)).map((line) => {
      return parseInt(line.slice(5, 6), 10)
    })
    assert.deepStrictEqual(segments, [3, 4, 5, 0, 1, 2], 'segment order')

    const discIx = actual.findIndex(matchTag(tags.disc))
    assert.equal(discIx, actual.length - 1 - (2 * 3), 'discontinuity tag index')
  })

  it('loops for a really really long time', () => {
    const looper = new HLSLoop(example.join('\n'))

    const loops = 1e6
    const actual = looper._render(loops * (10 + 5 + 2 + 10 + 10 + 10)).split('\n')
    const mediaSeq = matchTag(tags.mediaSeq)(actual.find(matchTag(tags.mediaSeq)))
    assert.strictEqual(parseInt(mediaSeq[1], 10), 6 * loops, 'media sequence')
  })

  it('omits discontinuity tags on the first segment', () => {
    const looper = new HLSLoop(example.join('\n'))

    const actual = looper._render(10 + 5 + 2 + 10 + 10 + 10).split('\n')
    const matchDiscSeq = matchTag(tags.discSeq)
    const discSeq = parseInt(matchDiscSeq(actual.find(matchDiscSeq))[1], 10)

    assert.strictEqual(actual.findIndex(matchTag(tags.disc)), -1, 'discontinuity tag')
    assert.strictEqual(discSeq, 1, 'disc sequence number')
  })

  // skipped because multiple map declarations is not supported in
  // m3u8-codec
  it.skip('rotates EXT-X-MAP', () => {
    const mapsExample = [
      ...example.slice(0, 8), '#EXT-X-MAP:URI=init2.mp4', ...example.slice(8)
    ]
    const looper = new HLSLoop(mapsExample.join('\n'))

    const actual = looper._render(10).split('\n')
    const mapTags = new Map()
    for (let mapContext = null, i = 0; i < actual.length; i++) {
      let parsed = matchTag(tags.map)
      if (parsed) {
        mapContext = parsed[1]
        continue
      }
      parsed = matchTag(tags.segment)
      if (mapContext) {
        mapTags.set(mapContext, parsed[1])
        mapContext = null
      }
    }

    assert.deepStrictEqual(mapTags.entries(), [
      ['init.mp4', 'index1.m4s'],
      ['init2.mp4', 'index3.m4s'],
      ['init.mp4', 'index0.m4s']
    ], 'map indices')
  })

  it.skip('can unset MAP declarations when required by rotation', () => {
    assert.fail('not implemented')
  })
  it.skip('rotates EXT-X-KEY', () => {
    assert.fail('not implemented')
  })
})
