# mdsf-bmfont

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Converts a `.ttf` font file into multichannel signed distance fields, then outputs packed spritesheets and a json representation of an AngelCode BMfont.

Signed distance fields are a method of reproducing vector shapes from a texture representation, popularized in [this paper by Valve](http://www.valvesoftware.com/publications/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf).
This tool uses [Chlumsky/msdfgen](https://github.com/Chlumsky/msdfgen) to generate multichannel signed distance fields to preserve corners. The distance fields are created from vector fonts, then rendered into texture pages. A BMFont object is provided for character layout.

## Install

```sh
npm install msdf-bmfont --save-dev
```
## Examples

Writing the distance fields and font data to disk:
```js
const generateBMFont = require('msdf-bmfont');
const fs = require('fs');

generateBMFont('Some-Font.ttf', (error, textures, font) => {
  if (error) throw error;
  textures.forEach((sheet, index) => {
    font.pages.push(`sheet${index}.png`);
    fs.writeFile(`sheet${index}.png`, sheet, (err) => {
      if (err) throw err;
    });
  });
  fs.writeFile('font.fnt', JSON.stringify(font), (err) => {
    if (err) throw err;
  });
});
```

Generating a single channel signed distance field with a custom character set:
```js
const generateBMFont = require('msdf-bmfont');

const opt = {
  charset: 'ABC.ez_as-123!',
  fieldType: 'sdf'
};
generateBMFont('Some-Font.ttf', opt, (error, textures, font) => {
	...
});
```

## Usage

#### `generateBMFont(fontPath, [opt], callback)`

Renders a bitmap font from the font at `fontPath` with optional `opt` settings, triggering `callback` on complete.

Options:
- `charset` (String|Array)
  - the characters to include in the bitmap font. Defaults to all ASCII printable characters. 
- `fontSize` (Number)
  - the font size at which to generate the distance field. Defaults to `32`
- `textureWidth, textureHeight` (Number)
  - the dimensions of an output texture sheet, normally power-of-2 for GPU usage. Both dimensions default to `512`
- `texturePadding` (Number)
  - pixels between each glyph in the texture. Defaults to `2`
- `fieldType` (String)
  - what kind of distance field to generate. Defaults to `msdf`. Must be one of:
    - `msdf` Multi-channel signed distance field
    - `sdf` Monochrome signed distance field
    - `psdf` monochrome signed pseudo-distance field
- `distanceRange` (Number)
  - the width of the range around the shape between the minimum and maximum representable signed distance in pixels, defaults to `3`

The `callback` is called with the arguments `(error, textures, font)`

- `error` on success will be null/undefined
- `textures` an array of Buffers, each containing the PNG data of one texture sheet
- `font` an object containing the BMFont data, to be used to render the font

Since `opt` is optional, you can specify `callback` as the second argument.

## License

MIT, see [LICENSE.md](http://github.com/Jam3/xhr-request/blob/master/LICENSE.md) for details.