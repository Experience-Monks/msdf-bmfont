const generateBMFont = require('./index');
const fs = require('fs');
const path = require('path');

const opt = {
  charset: 'ABCDEFG1234567 ',
  fieldType: 'msdf'
};
generateBMFont('Roboto-Regular.ttf', opt, (error, textures, font) => {
  if (error) throw error;
  textures.forEach((sheet, index) => {
    font.pages.push(`sheet${index}.png`);
    fs.writeFile(path.join('output', `sheet${index}.png`), sheet, (err) => {
      if (err) throw err;
      console.log('wrote spritesheet', index);
    });
  });
  fs.writeFile(path.join('output', 'font.fnt'), JSON.stringify(font), (err) => {
    if (err) throw err;
    console.log('wrote font file');
  });
});
