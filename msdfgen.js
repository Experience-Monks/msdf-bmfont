const opentype = require('opentype.js');
const exec = require('child_process').exec;
const mapLimit = require('map-limit');
const MultiBinPacker = require('multi-bin-packer');
const Canvas = require('canvas');
const fs = require('fs');

let lPadding = 2.0;
let rPadding = 2.0;
let tPadding = 2.0;
let bPadding = 2.0;

module.exports = function (fontPath) {
  const font = opentype.loadSync(fontPath);
  generateSpritesheet('abc', 64, 512, 512, 2);

  function generateSpritesheet (charset, fontSize, width, height, padding) {
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
      packer.bins.forEach((bin, index) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        bin.rects.forEach(rect => {
          context.putImageData(rect.data, rect.x, rect.y);
        });
        const sheetBuffer = canvas.toBuffer();
        fs.writeFile(`sheet${index}.png`, sheetBuffer, (err) => {
          if (err) throw err;
        });
      });
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
            shapeDesc += `(${command.x1}, ${-command.y1}; ${command.x2}, ${-command.y2}); `;
          } else if (command.type === 'Q') {
            shapeDesc += `(${command.x1}, ${-command.y1}); `;
          }
          shapeDesc += `${command.x}, ${-command.y}`;
        }
        if (index !== lastIndex) {
          shapeDesc += '; ';
        }
      });
      shapeDesc += '}';
    });
    // normalize ?
    if (contours.some(cont => cont.length === 1)) console.log('length is 1, failed to normalize glyph');
    // const scale = fontSize / font.unitsPerEm; // scale * units = pixels
    const scale = fontSize / font.unitsPerEm;
    const width = Math.round((glyph.xMax - glyph.xMin) * scale + lPadding + rPadding);
    const height = Math.round((glyph.yMax - glyph.yMin) * scale + tPadding + bPadding);
    const command = `./msdfgen.bin msdf -format text -stdout -size ${width} ${height} -translate ${-rPadding} ${bPadding} -defineshape "${shapeDesc}"`;
    exec(command, (err, stdout, stderr) => {
      if (err) callback(err);
      const rawImageData = stdout.match(/([0-9a-fA-F]+)/g).map(str => parseInt(str, 16)); // split on every number, parse
      const pixels = [];
      for (let i = 0; i < rawImageData.length; i += 3) {
        pixels.push(...rawImageData.slice(i, i + 3), 255); // add 255 as alpha every 3 elements
      }
      const imageData = new Canvas.ImageData(new Uint8ClampedArray(pixels), width, height);
      const container = {data: imageData, width, height};
      callback(null, container);
    });
  }
};

module.exports('Roboto-Regular.ttf');
