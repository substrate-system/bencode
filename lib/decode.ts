import { arr2text, text2arr, arr2hex } from '@substrate-system/uint8-util'

const INTEGER_START = 0x69 // 'i'
const STRING_DELIM = 0x3A // ':'
const DICTIONARY_START = 0x64 // 'd'
const LIST_START = 0x6C // 'l'
const END_OF_TYPE = 0x65 // 'e'

export interface Decoder {
    (data, start, end, encoding):{ 'string':string; integer:number }|null;
    data:Uint8Array|null;
    bytes;
    position:number;
    encoding:string|null;
    next:()=>any;
    dictionary:()=>any;
    list:()=>any;
    buffer:()=>ArrayBufferLike;
    find:(ch:number)=>number|null;
    integer:()=>number;
}

/**
 * replaces parseInt(buffer.toString('ascii', start, end)).
 * For strings with less then ~30 charachters, this is actually a lot faster.
 *
 * @param {Uint8Array} data
 * @param {Number} start
 * @param {Number} end
 * @return {Number} calculated number
 */
function getIntFromBuffer (buffer, start, end) {
    let sum = 0
    let sign = 1

    for (let i = start; i < end; i++) {
        const num = buffer[i]

        if (num < 58 && num >= 48) {
            sum = sum * 10 + (num - 48)
            continue
        }

        if (i === start && num === 43) { // +
            continue
        }

        if (i === start && num === 45) { // -
            sign = -1
            continue
        }

        if (num === 46) { // .
            // its a float. break here.
            break
        }

        throw new Error('not a number: buffer[' + i + '] = ' + num)
    }

    return sum * sign
}

/**
 * Decodes bencoded data.
 *
 * @param  {Uint8Array} data
 * @param  {Number} start (optional)
 * @param  {Number} end (optional)
 * @param  {String} encoding (optional)
 * @return {Object|Array|Uint8Array|String|Number}
 */
const decode:Decoder = function decode (
    data:Uint8Array,
    start,
    end,
    encoding
):Record<string, any>|Array<any>|Uint8Array|string|number|null {
    if (data == null || data.length === 0) {
        return null
    }

    if (typeof start !== 'number' && encoding == null) {
        encoding = start
        start = undefined
    }

    if (typeof end !== 'number' && encoding == null) {
        encoding = end
        end = undefined
    }

    decode.position = 0
    decode.encoding = encoding || null

    decode.data = !(ArrayBuffer.isView(data))
        ? text2arr(data)
        : new Uint8Array(data.slice(start, end))

    decode.bytes = decode.data.length

    return decode.next()
}

decode.bytes = 0
decode.position = 0
decode.data = null
decode.encoding = null

decode.next = function () {
    switch (decode.data![decode.position]) {
        case DICTIONARY_START:
            return decode.dictionary()
        case LIST_START:
            return decode.list()
        case INTEGER_START:
            return decode.integer()
        default:
            return decode.buffer()
    }
}

decode.find = function (chr) {
    if (!decode.data?.length) return null
    let i = decode.position
    const c = decode.data.length
    const d = decode.data

    while (i < c) {
        if (d[i] === chr) return i
        i++
    }

    throw new Error(
        'Invalid data: Missing delimiter "' +
        String.fromCharCode(chr) + '" [0x' +
        chr.toString(16) + ']'
    )
}

decode.dictionary = function ():Record<string, any>|null {
    if (!decode.data) return null
    decode.position++

    const dict = {}

    while (decode.data[decode.position] !== END_OF_TYPE) {
        const buffer = decode.buffer()
        let key = arr2text(buffer)
        if (key.includes('\uFFFD')) key = arr2hex(buffer)
        dict[key] = decode.next()
    }

    decode.position++

    return dict
}

decode.list = function () {
    decode.position++

    const lst = []

    while (decode.data[decode.position] !== END_OF_TYPE) {
        lst.push(decode.next())
    }

    decode.position++

    return lst
}

decode.integer = function () {
    const end = decode.find(END_OF_TYPE)
    const number = getIntFromBuffer(decode.data, decode.position + 1, end)

    decode.position += end + 1 - decode.position

    return number
}

decode.buffer = function () {
    let sep = decode.find(STRING_DELIM)
    const length = getIntFromBuffer(decode.data, decode.position, sep)
    const end = ++sep + length

    decode.position = end

    return decode.encoding
        ? arr2text(decode.data.slice(sep, end))
        : decode.data.slice(sep, end)
}

export default decode
