import { test } from '@substrate-system/tapzero'
import bencode from '../src/index.js'

test('encodingLength( value )', function (t) {
    t.plan(1)
    const input = { string: 'Hello World', integer: 12345 }
    const output = Buffer.from('d7:integeri12345e6:string11:Hello Worlde')
    t.equal(bencode.encodingLength(input), output.length)
})

test('encoding.bytes', t => {
    const output = bencode.encode({ string: 'Hello World', integer: 12345 })
    t.plan(1)
    t.equal(output?.length, bencode.encode.bytes)
})

test('encode into an existing buffer', function (t) {
    const input = { string: 'Hello World', integer: 12345 }
    const output = Buffer.from('d7:integeri12345e6:string11:Hello Worlde')
    const target = Buffer.allocUnsafe(output.length)
    bencode.encode(input, target)
    t.plan(1)
    t.deepEqual(target, output)
})

test('encode into a buffer with an offset', function (t) {
    const input = { string: 'Hello World', integer: 12345 }
    const output = Buffer.from('d7:integeri12345e6:string11:Hello Worlde')
    const target = Buffer.allocUnsafe(64 + output.length) // Pad with 64 bytes
    const offset = 48
    bencode.encode(input, target, offset)
    t.plan(1)
    t.deepEqual(target.slice(offset, offset + output.length), output)
})

test('decode.bytes', function (t) {
    const input = Buffer.from('d7:integeri12345e6:string11:Hello Worlde')
    bencode.decode(input)
    t.plan(1)
    t.equal(bencode.decode.bytes, input.length)
})

test('decode from an offset', function (t) {
    t.plan(1)
    const pad = '_______________________________'
    const input = Buffer.from(pad + 'd7:integeri12345e6:string11:Hello Worlde')
    const output = bencode.decode(input, pad.length, 'utf8')
    t.deepEqual(output, { string: 'Hello World', integer: 12345 })
})

test('decode between an offset and end', function (t) {
    t.plan(1)
    const pad = '_______________________________'
    const data = 'd7:integeri12345e6:string11:Hello Worlde'
    const input = Buffer.from(pad + data + pad)
    const output = bencode.decode(input, pad.length, pad.length + data.length, 'utf8')
    t.deepEqual(output, { string: 'Hello World', integer: 12345 })
})
