const generateBMFont = require('../index');
const fs = require('fs');
const path = require('path');
const savePixels = require('save-pixels');

const opt = {

};
generateBMFont(path.join(__dirname, 'Roboto-Regular.ttf'), opt, (error, textures, font) => {
  if (error) throw error;
  textures.forEach((sheet, index) => {
    font.pages.push(`sheet${index}.png`);
    const writeStream = fs.createWriteStream(path.join(__dirname, `sheet${index}.png`));
    const pixStream = savePixels(sheet, 'png');
    pixStream.pipe(writeStream);
    pixStream.on('end', () => {
      console.log('wrote spritesheet', index);
    });
  });
  fs.writeFile(path.join(__dirname, 'font.fnt'), JSON.stringify(font), (err) => {
    if (err) throw err;
    console.log('wrote font file');
  });
});
