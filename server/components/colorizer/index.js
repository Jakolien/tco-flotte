import fs from 'fs';
import path from 'path';
import chroma from 'chroma-js';

// Secure a regex
// @src https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
const escapeRegExp = (str = '')=>{
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

// Secure "replaceAll" method
// @src http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
const replaceAll = (find = '', replace = '', str = '')=> {
  return str.replace( new RegExp( escapeRegExp(find), "g"), replace);
};

// True if the given string is a color
const isColor = (str = '')=> {
  try {
    return !!chroma(str);
  } catch (e) {
    return false;
  }
};

export default function(req, res) {
  try {
    let svg = fs.readFileSync( path.join(__dirname, '../../../client/', decodeURI(req.path)), "utf8");
    let hex = req.query.color;
    // Is a color given?
    if( isColor(hex) ) {
      // Instanciate chroma class
      let color = chroma(hex);
      // Limit luminance
      color = color.luminance(Math.min(0.4, color.luminance()));
      // Replace the color
      svg = replaceAll('#666', color.hex(), svg);
    }
    // Then simply return the svg
    res.contentType("image/svg+xml");
    res.send(svg).end();
  } catch (e) {
    res.send(404);
  }
};
