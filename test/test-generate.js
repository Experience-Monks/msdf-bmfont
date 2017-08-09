const generateBMFont = require('../index');
const fs = require('fs');
const path = require('path');

const opt = {
  fieldType: "msdf",
  distanceRange: 5,
  roundDecimal: 0
};
generateBMFont(path.join(__dirname, 'Dimbo_R.ttf'), opt, (error, textures, font) => {
  if (error) throw error;
  textures.forEach((sheet, index) => {
    font.pages.push(`sheet${index}.png`);
    fs.writeFile(path.join(__dirname, `sheet${index}.png`), sheet, (err) => {
      if (err) throw err;
      console.log('wrote spritesheet', index);
    });
  });
  fs.writeFile(path.join(__dirname, 'font.json'), JSON.stringify(font), (err) => {
    if (err) throw err;
    console.log('wrote font file');
  });
});
