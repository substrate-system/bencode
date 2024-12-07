import { arr2hex, text2arr, arr2text } from '@substrate-system/uint8-util'

const INTEGER_START = 0x69  // 'i'
const STRING_DELIM = 0x3A  // ':'
const DICTIONARY_START = 0x64  // 'd'
const LIST_START = 0x6C  // 'l'
const END_OF_TYPE = 0x65  // 'e'

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

export interface Decode {
    (data:Uint8Array, start?:number, end?:number, encoding?:string):{
        'string':string;
        integer:number;
    }
    (input:Uint8Array, start:number, encoding:string):{
        'string':string;
        integer:number;
    }
    data:Uint8Array|null;
    encoding:null|string;
    bytes:number;
    position:number;
    dictionary:()=>Record<string, string>|null;
    next:()=>any;
    list:()=>any;
    integer:()=>any;
    buffer:()=>any;
    find:(char:number)=>number|null;
}

/**
 * Decodes bencoded data.
 *
 * @param  {Uint8Array} data
 * @param  {number|string} [start] (optional)
 * @param  {number|string} [end] (optional)
 * @param  {string} [encoding] (optional)
 * @return {Object|Array|Uint8Array|string|number}
 */
export const decode:Decode = function decode (
    data:Uint8Array,
    _start?:number|string,
    _end?:number|string,
    _encoding?:string
) {
    if (data == null || data.length === 0) {
        return null
    }

    let encoding:string|undefined = _encoding
    let start:number|undefined
    let end:number|undefined

    if (typeof _start !== 'number' && _encoding == null) {
        encoding = _start!
        start = undefined
    }

    if (typeof _end !== 'number' && _encoding == null) {
        encoding = _end!
        end = undefined
    }

    decode.position = 0
    decode.encoding = encoding || null

    decode.data = !(ArrayBuffer.isView(data)) ?
        text2arr(data) :
        new Uint8Array(data.slice(start as number|undefined, end as number|undefined))

    decode.bytes = decode.data?.length || 0

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

decode.find = function (chr:number):number|null {
    if (!decode.data) return null
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

decode.dictionary = function ():Record<string, string>|null {
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
    if (!decode.data) return null
    decode.position++

    const lst = []

    while (decode.data[decode.position] !== END_OF_TYPE) {
        lst.push(decode.next())
    }

    decode.position++

    return lst
}

decode.integer = function ():number {
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
