const opentype = require('opentype.js');
const exec = require('child_process').exec;
const mapLimit = require('map-limit');
const MultiBinPacker = require('multi-bin-packer');
const Canvas = require('canvas');
const path = require('path');

const defaultCharset = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".split('');

const binaryLookup = {
  darwin: 'msdfgen.osx',
  win32: 'msdfgen.exe'
};

module.exports = generateBMFont;

function generateBMFont (fontPath, opt, callback) {
  const binName = binaryLookup[process.platform];
  if (binName === undefined) {
    throw new Error(`No msdfgen binary for platform ${process.platform}.`);
  }
  const binaryPath = path.join(__dirname, 'bin', binName);

  if (!fontPath || typeof fontPath !== 'string') {
    throw new TypeError('must specify a font path');
  }
  if (typeof opt === 'function') {
    callback = opt;
    opt = {};
  }
  if (callback && typeof callback !== 'function') {
    throw new TypeError('expected callback to be a function');
  }
  if (!callback) {
    throw new TypeError('missing callback');
  }

  callback = callback || function () {};
  opt = opt || {};
  let charset = (typeof opt.charset === 'string' ? opt.charset.split('') : opt.charset) || defaultCharset;
  const fontSize = opt.fontSize || 42;
  const textureWidth = opt.textureWidth || 512;
  const textureHeight = opt.textureHeight || 512;
  const texturePadding = opt.texturePadding || 2;
  const distanceRange = opt.distanceRange || 3;
  const fieldType = opt.fieldType || 'msdf';
  if (fieldType !== 'msdf' && fieldType !== 'sdf' && fieldType !== 'psdf') {
    throw new TypeError('fieldType must be one of msdf, sdf, or psdf');
  }

  const font = opentype.loadSync(fontPath);
  if (font.outlinesFormat !== 'truetype') {
    throw new TypeError('must specify a truetype font');
  }
  const canvas = Canvas.createCanvas(textureWidth, textureHeight);
  const context = canvas.getContext('2d');
  const packer = new MultiBinPacker(textureWidth, textureHeight, texturePadding);
  const chars = [];
  mapLimit(charset, 15, (char, cb) => {
    generateImage({
      binaryPath,
      font,
      char,
      fontSize,
      fieldType,
      distanceRange
    }, (err, res) => {
      if (err) return cb(err);
      cb(null, res);
    });
  }, (err, results) => {
    if (err) callback(err);
    packer.addArray(results);
    const textures = packer.bins.map((bin, index) => {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      if (opt.transparent) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      bin.rects.forEach(rect => {
        if (rect.data.imageData) {
          context.putImageData(rect.data.imageData, rect.x, rect.y);
        }
        const charData = rect.data.fontData;
        charData.x = rect.x;
        charData.y = rect.y;
        charData.page = index;
        chars.push(rect.data.fontData);
      });
      return canvas.toBuffer();
    });
    const kernings = [];
    charset.forEach(first => {
      charset.forEach(second => {
        const amount = font.getKerningValue(font.charToGlyph(first), font.charToGlyph(second));
        if (amount !== 0) {
          kernings.push({
            first: first.charCodeAt(0),
            second: second.charCodeAt(0),
            amount: amount * (fontSize / font.unitsPerEm)
          });
        }
      });
    });

    const os2 = font.tables.os2;
    const name = font.tables.name.fullName;
    const fontData = {
      pages: [],
      chars,
      info: {
        face: name[Object.getOwnPropertyNames(name)[0]],
        size: fontSize,
        bold: 0,
        italic: 0,
        charset,
        unicode: 1,
        stretchH: 100,
        smooth: 1,
        aa: 1,
        padding: [0, 0, 0, 0],
        spacing: [texturePadding, texturePadding]
      },
      common: {
        lineHeight: (os2.sTypoAscender - os2.sTypoDescender + os2.sTypoLineGap) * (fontSize / font.unitsPerEm),
        base: font.ascender * (fontSize / font.unitsPerEm),
        scaleW: textureWidth,
        scaleH: textureHeight,
        pages: packer.bins.length,
        packed: 0,
        alphaChnl: 0,
        redChnl: 0,
        greenChnl: 0,
        blueChnl: 0
      },
      kernings: kernings
    };
    callback(null, textures, fontData);
  });
}

function generateImage (opt, callback) {
  const {binaryPath, font, char, fontSize, fieldType, distanceRange} = opt;
  const glyph = font.charToGlyph(char);
  const commands = glyph.getPath(0, 0, fontSize).commands;
  let contours = [];
  let currentContour = [];
  let bBox = {
    left: 0,
    bottom: 0,
    right: 0,
    top: 0
  };
  commands.forEach(command => {
    if (command.type === 'M') { // new contour
      if (currentContour.length > 0) {
        contours.push(currentContour);
        currentContour = [];
      }
    }
    currentContour.push(command);
  });
  contours.push(currentContour);

  let shapeDesc = '';
  let firstCommand = true;
  contours.forEach(contour => {
    shapeDesc += '{';
    const lastIndex = contour.length - 1;
    contour.forEach((command, index) => {
      if (command.type === 'Z') {
        // shapeDesc += `${contour[0].x}, ${contour[0].y}`;
        // adding the last point breaks it??!??!
      } else {
        if (command.type === 'C') {
          shapeDesc += `(${command.x1}, ${command.y1}; ${command.x2}, ${command.y2}); `;
        } else if (command.type === 'Q') {
          shapeDesc += `(${command.x1}, ${command.y1}); `;
        }
        shapeDesc += `${command.x}, ${command.y}`;
        if (firstCommand) {
          bBox.left = command.x;
          bBox.bottom = command.y;
          bBox.right = command.x;
          bBox.top = command.y;
          firstCommand = false;
        } else {
          bBox.left = Math.min(bBox.left, command.x);
          bBox.bottom = Math.min(bBox.bottom, command.y);
          bBox.right = Math.max(bBox.right, command.x);
          bBox.top = Math.max(bBox.top, command.y);
        }
      }
      if (index !== lastIndex) {
        shapeDesc += '; ';
      }
    });
    shapeDesc += '}';
  });
  if (contours.some(cont => cont.length === 1)) console.log('length is 1, failed to normalize glyph');
  const scale = fontSize / font.unitsPerEm;
  const baseline = font.ascender * (fontSize / font.unitsPerEm);
  const pad = 5;
  let width = Math.round(bBox.right - bBox.left) + pad + pad;
  let height = Math.round(bBox.top - bBox.bottom) + pad + pad;
  let yOffset = -bBox.bottom + pad;
  let command = `${binaryPath} ${fieldType} -format text -stdout -size ${width} ${height} -translate ${pad} ${yOffset} -pxrange ${distanceRange} -defineshape "${shapeDesc}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) return callback(err);
    const rawImageData = stdout.match(/([0-9a-fA-F]+)/g).map(str => parseInt(str, 16)); // split on every number, parse from hex
    const pixels = [];
    const channelCount = rawImageData.length / width / height;

    if (!isNaN(channelCount) && channelCount % 1 !== 0) {
      console.error(command);
      console.error(stdout);
      return callback(new RangeError('msdfgen returned an image with an invalid length'));
    }
    if (fieldType === 'msdf') {
      for (let i = 0; i < rawImageData.length; i += channelCount) {
        pixels.push(...rawImageData.slice(i, i + channelCount), 255); // add 255 as alpha every 3 elements
      }
    } else {
      for (let i = 0; i < rawImageData.length; i += channelCount) {
        pixels.push(rawImageData[i], rawImageData[i], rawImageData[i], 255); // make monochrome w/ alpha
      }
    }
    let imageData;
    if (isNaN(channelCount) || !rawImageData.some(x => x !== 0)) { // if character is blank
      console.warn(`no bitmap for character '${char}' (${char.charCodeAt(0)}), adding to font as empty`);
      console.warn(command);
      console.warn('---');
      width = 0;
      height = 0;
    } else {
      imageData = new Canvas.ImageData(new Uint8ClampedArray(pixels), width, height);
    }
    const container = {
      data: {
        imageData,
        fontData: {
          id: char.charCodeAt(0),
          width: width,
          height: height,
          xoffset: 0,
          yoffset: bBox.bottom - pad + baseline,
          xadvance: glyph.advanceWidth * scale,
          chnl: 15
        }
      },
      width: width,
      height: height
    };
    callback(null, container);
  });
}
