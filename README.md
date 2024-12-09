# bencode

![tests](https://github.com/substrate-system/node-bencode/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@substrate-system/bencode?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/bencode?cache-control=no-cache)](https://packagephobia.com/result?p=@substrate-system/bencode)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

A library for encoding and decoding bencoded data,
according to the [BitTorrent specification](http://www.bittorrent.org/beps/bep_0003.html).

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [About BEncoding](#about-bencoding)
- [Install](#install)
- [Usage](#usage)
  * [Encoding](#encoding)
  * [Decoding](#decoding)
- [API](#api)
  * [bencode.encode( *data*, *[buffer]*, *[offset]* )](#bencodeencode-data-buffer-offset-)
  * [bencode.decode( *data*, *[start]*, *[end]*, *[encoding]* )](#bencodedecode-data-start-end-encoding-)
  * [bencode.byteLength( *value* ) or bencode.encodingLength( *value* )](#bencodebytelength-value--or-bencodeencodinglength-value-)

<!-- tocstop -->

</details>

## About BEncoding

from [Wikipedia](https://en.wikipedia.org/wiki/Bencoding):

Bencode (pronounced like B encode) is the encoding used by the peer-to-peer
file sharing system BitTorrent for storing and transmitting loosely structured data.

It supports four different types of values:
- byte strings
- integers
- lists
- dictionaries

Bencoding is most commonly used in torrent files.
These metadata files are simply bencoded dictionaries.

## Install

```sh
npm i -S @substrate-system/bencode
```

## Usage

```js
import bencode from '@substrate-system/bencode'
```

### Encoding

```js
const data = {
  string: 'Hello World',
  integer: 12345,
  dict: {
    key: 'This is a string within a dictionary'
  },
  list: [ 1, 2, 3, 4, 'string', 5, {} ]
}

const result = bencode.encode( data )
```

>
> [!NOTE]  
> As of `bencode@0.8.0`, boolean values will be cast to integers (false -> 0, true -> 1).
>


#### Output

```
d4:dictd3:key36:This is a string within a dictionarye7:integeri12345e4:listli1ei2ei3ei4e6:stringi5edee6:string11:Hello Worlde
```

### Decoding

```js
import bencode from '@substrate-system/bencode'

var const = Buffer.from('d6:string11:Hello World7:integeri12345e4:dictd3:key36:This is a string within a dictionarye4:listli1ei2ei3ei4e6:stringi5edeee')
const result = bencode.decode(data)
```

#### Output

```
{
  string: <Buffer 48 65 6c 6c 6f 20 57 6f 72 6c 64>,
  integer: 12345,
  dict: {
    key: <Buffer 54 68 69 73 20 69 73 20 61 20 73 74 72 69 6e 67 20 77 69 74 68 69 6e 20 61 20 64 69 63 74 69 6f 6e 61 72 79>
  },
  list: [ 1, 2, 3, 4, <Buffer 73 74 72 69 6e 67>, 5, {} ]
}
```

Automagically convert bytestrings to strings:

```js
const result = bencode.decode(data, 'utf8')
```

#### Output

```js
{
  string: 'Hello World',
  integer: 12345,
  dict: {
    key: 'This is a string within a dictionary'
  },
  list: [ 1, 2, 3, 4, 'string', 5, {} ]
}
```

## API

The API is compatible with the [`abstract-encoding`](https://github.com/mafintosh/abstract-encoding) specification.

### bencode.encode( *data*, *[buffer]*, *[offset]* )

```ts
function encode (
    data?:TypedArray|any[]|string|number|boolean|object|null,
    buffer?:Uint8Array,
    offset?:number
):Uint8Array|null
```

Returns `Uint8Array`.

### bencode.decode( *data*, *[start]*, *[end]*, *[encoding]* )

```ts
type Decoded =
    | Record<string, any>
    | Array<any>
    | Uint8Array
    | string
    | number
    | null;

interface Decoder {
    (data:Uint8Array|string):Decoded
    (data:Uint8Array|string, encoding:string):Decoded
    (data:Uint8Array|string, start:number, encoding:string):Decoded
    (data:Uint8Array|string, start:number, end:number, encoding:string):Decoded
    data:Uint8Array|null;
    bytes;
    position:number;
    encoding:string|null;
    next:()=>any;
    dictionary:()=>any;
    list:()=>any;
    buffer:()=>Uint8Array|string;
    find:(ch:number)=>number|null;
    integer:()=>number;
}

const decode:Decoder = function decode (
    data:Uint8Array|string,
    start?:number|string,
    end?:number|string,
    encoding?:string
):Decoded
```

If `encoding` is set, bytestrings are automatically converted to strings.

Returns `Object` | `Array` | `Buffer` | `String` | `Number`

### bencode.byteLength( *value* ) or bencode.encodingLength( *value* )

> `Buffer` | `Array` | `String` | `Object` | `Number` | `Boolean` __value__
