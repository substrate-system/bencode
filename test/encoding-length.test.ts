import fs from 'fs'
import path, { dirname } from 'path'
import { test } from '@substrate-system/tapzero'
import { fileURLToPath } from 'url'
import bencode from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const torrent = fs.readFileSync(
    path.join(__dirname, '..', 'benchmark', 'test.torrent')
)

test('torrent', function (t) {
    t.plan(1)
    const value = bencode.decode(torrent)
    const length = bencode.encodingLength(value)
    t.equal(length, torrent.length)
})

test('returns correct length for empty dictionaries', function (t) {
    t.plan(2)
    t.equal(bencode.encodingLength({}), 2) // de
    t.equal(bencode.encodingLength(new Map()), 2) // de
})

test('returns correct length for dictionaries', function (t) {
    t.plan(2)
    const obj = { a: 1, b: 'str', c: { de: 'f' } }
    const map = new Map<string, string|number|object>([
        ['a', 1],
        ['b', 'str'],
        ['c', { de: 'f' }]
    ])
    t.equal(bencode.encodingLength(obj), 28) // d1:ai1e1:b3:str1:cd2:de1:fee
    t.equal(bencode.encodingLength(map), 28) // d1:ai1e1:b3:str1:cd2:de1:fee
})

test('returns correct length for empty lists', function (t) {
    t.plan(2)
    t.equal(bencode.encodingLength([]), 2) // le
    t.equal(bencode.encodingLength(new Set()), 2) // le
})

test('returns correct length for lists', function (t) {
    t.plan(3)
    t.equal(bencode.encodingLength([1, 2, 3]), 11) // li1ei2ei3ee
    t.equal(bencode.encodingLength([1, 'string', [{ a: 1, b: 2 }]]), 29) // li1e6:stringld1:ai1e1:bi2eeee
    t.equal(bencode.encodingLength(new Set([1, 'string', [{ a: 1, b: 2 }]])), 29) // li1e6:stringld1:ai1e1:bi2eeee
})

test('returns correct length for integers', function (t) {
    t.plan(2)
    t.equal(bencode.encodingLength(-0), 3)  // i0e
    t.equal(bencode.encodingLength(-1), 4)  // i-1e
})

test('returns integer part length for floating point numbers', function (t) {
    t.plan(1)
    t.equal(bencode.encodingLength(100.25), 1 + 1 + 3)
})

test('returns correct length for BigInts', function (t) {
    t.plan(1)
    // 2n ** 128n == 340282366920938463463374607431768211456
    t.equal(bencode.encodingLength(340282366920938463463374607431768211456), 1 + 1 + 39)
})

test('returns zero for undefined or null values', function (t) {
    t.plan(2)
    t.equal(bencode.encodingLength(null), 0)
    t.equal(bencode.encodingLength(undefined), 0)
})
