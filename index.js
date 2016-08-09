const getSDFGenerator = require('./msdfgen');
const fs = require('fs');
const path = require('path');

const makeSDF = getSDFGenerator('Roboto-Regular.ttf');

const charset = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz ';
// const charset = 'j';
const fontSize = 32;
const pageWidth = 512;
const pageHeight = 512;
const pagePadding = 2;

makeSDF(charset, fontSize, pageWidth, pageHeight, pagePadding, (generated) => {
  generated.spritesheets.forEach((sheet, index) => {
    generated.fontData.pages.push(`sheet${index}.png`);
    fs.writeFile(path.join('output', `sheet${index}.png`), sheet, (err) => {
      if (err) throw err;
      console.log('wrote spritesheet', index);
    });
  });
  fs.writeFile(path.join('output', 'font.fnt'), JSON.stringify(generated.fontData), (err) => {
    if (err) throw err;
    console.log('wrote font file');
  });
});
