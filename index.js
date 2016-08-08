const getSDFGenerator = require('./msdfgen');
const fs = require('fs');
const path = require('path');

const makeSDF = getSDFGenerator('Roboto-Regular.ttf');

const charset = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';
// const charset = 'abcdefghijklmnop';
const fontSize = 32;
const pageWidth = 256;
const pageHeight = 256;
const pagePadding = 2;

makeSDF(charset, fontSize, pageWidth, pageHeight, pagePadding, (generated) => {
  generated.spritesheets.forEach((sheet, index) => {
    fs.writeFile(path.join('output', `sheet${index}.png`), sheet, (err) => {
      if (err) throw err;
      console.log('wrote spritesheet', index);
    });
  });
});
