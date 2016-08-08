const opentype = require('opentype.js');
const exec = require('child_process').exec;
const mapLimit = require('map-limit');
const MultiBinPacker = require('multi-bin-packer');
const Canvas = require('canvas');

module.exports = function (fontPath) {
  const font = opentype.loadSync(fontPath);
  return generateSpritesheet;

  function generateSpritesheet (charset, fontSize, width, height, padding, callback) { // convert this to opts obj
    const canvas = new Canvas(width, height);
    const context = canvas.getContext('2d');
    const packer = new MultiBinPacker(width, height, padding);
    mapLimit(charset.split(''), 15, (char, cb) => {
      generateImage(char, fontSize, (err, res) => {
        if (err) return cb(err);
        cb(null, res);
      });
    }, (err, results) => {
      if (err) console.log(err);
      packer.addArray(results);
      const spritesheets = packer.bins.map((bin, index) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        bin.rects.forEach(rect => {
          context.putImageData(rect.data, rect.x, rect.y);
        });
        return canvas.toBuffer();
      });
      callback({spritesheets});
    });
  }

  function generateImage (char, fontSize, callback) {
    const glyph = font.charToGlyph(char);
    const commands = glyph.getPath(0, 0, fontSize).commands;

    let contours = [];
    let currentContour = [];
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
    contours.forEach(contour => {
      shapeDesc += '{';
      const lastIndex = contour.length - 1;
      contour.forEach((command, index) => {
        if (command.type === 'Z') {
          shapeDesc += '#';
        } else {
          // make sure to invert y coordinates
          if (command.type === 'C') {
            shapeDesc += `(${command.x1}, ${command.y1}; ${command.x2}, ${command.y2}); `;
          } else if (command.type === 'Q') {
            shapeDesc += `(${command.x1}, ${command.y1}); `;
          }
          shapeDesc += `${command.x}, ${command.y}`;
        }
        if (index !== lastIndex) {
          shapeDesc += '; ';
        }
      });
      shapeDesc += '}';
    });

    if (contours.some(cont => cont.length === 1)) console.log('length is 1, failed to normalize glyph');
    const scale = fontSize / font.unitsPerEm;
    // const width = Math.round((glyph.xMax - glyph.xMin) * scale) + 4;
    // const height = Math.round((glyph.yMax - glyph.yMin) * scale) + 4;
    // let command = `./msdfgen.bin msdf -format text -stdout -size ${width} ${height} -scale ${scale} -translate -2 2  -defineshape "${shapeDesc}"`;
    // command += ` -testrender output/${char.charCodeAt(0)}-render.png 1024 1024`;
    const pad = 3;
    const width = Math.round((glyph.xMax - glyph.xMin) * scale) + pad + pad;
    const height = Math.round((glyph.yMax - glyph.yMin) * scale) + pad + pad;
    let command = `./msdfgen.bin msdf -format text -stdout -size ${width} ${height} -translate 1 ${height - 4} -pxrange 3 -defineshape "${shapeDesc}"`;
    command += ` -testrender output/${char.charCodeAt(0)}-render.png ${width * 10} ${height * 10}`;
    if (char === 'j') {
      console.log('width', glyph.xMax - glyph.xMin);
      console.log('scaledWidth', width - 4);

      console.log('height', glyph.yMax - glyph.yMin);
      console.log('scaledHeight', height - 4);
    }
    exec(command, (err, stdout, stderr) => {
      if (err) callback(err);
      const rawImageData = stdout.match(/([0-9a-fA-F]+)/g).map(str => parseInt(str, 16)); // split on every number, parse
      const pixels = [];
      for (let i = 0; i < rawImageData.length; i += 3) {
        pixels.push(...rawImageData.slice(i, i + 3), 255); // add 255 as alpha every 3 elements
      }
      if (((pixels.length / 4) / width) / height !== 1) {
        console.log('output error, image is wrong length');
        console.log('expected', width * height * 4, 'got', pixels.length);
        debugger;
      }
      const imageData = new Canvas.ImageData(new Uint8ClampedArray(pixels), width, height);
      const container = {data: imageData, width, height};
      callback(null, container);
    });
  }
};
