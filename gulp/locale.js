'use strict';

import _    from 'lodash';
import gulp from 'gulp';
import jeditor from "gulp-json-editor";

import extractTranslate from 'gulp-angular-translate-extractor';
import {clientPath} from './paths';

gulp.task('locales', function () {
  var i18nsrc  = [`${clientPath}/{app,components}/**/*.{pug,js,html}`];
  var i18ndest = `${clientPath}/assets/locales`;
  var i18base  = require(`../${clientPath}/assets/locales/en.json`);
  return gulp.src(i18nsrc)
    .pipe(extractTranslate({
      defaultLang: 'en',
        lang: ['en', 'de'],
        dest: i18ndest,
        safeMode: true,
        stringifyOptions: true
    }))
    .pipe(jeditor( (json)=> {
      // Create every missing keys
      _.keys(i18base).forEach( key=> json[key] = json[key] || '' );
      // Return the modified json 
      return json;
    }))
    .pipe(gulp.dest(i18ndest));
});
