import encode from './encode.js'
import byteLength from './encoding-length.js'
import decode from './decode.js'

export * from './decode.js'

/**
 * Determines the amount of bytes
 * needed to encode the given value
 * @param  {Object|Array|Uint8Array|String|Number|Boolean} value
 * @return {Number} byteCount
 */
const encodingLength = byteLength
export default { encode, decode, byteLength, encodingLength }
