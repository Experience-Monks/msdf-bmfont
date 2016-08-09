const getBMFontGenerator = require('./msdfgen');
const fs = require('fs');
const path = require('path');

const generateBMFont = getBMFontGenerator('Roboto-Regular.ttf');

const charset = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz '.split('');

const fontSize = 32;
const pageWidth = 512;
const pageHeight = 512;
const pagePadding = 2;

generateBMFont(charset, fontSize, pageWidth, pageHeight, pagePadding, (generated) => {
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
