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
  var settings = require(`../${clientPath}/assets/settings.json`);
  // An object with existing labels
  var labels   = _.chain(settings).keyBy('name').mapValues('label').value();
  // A list of keys that cannot be found with extractTranslate
  var missingKeys = _.keys(i18base);
  // Also from the variable names
  missingKeys = missingKeys.concat(_.keys(labels));
  // Also from the variable units
  missingKeys = missingKeys.concat(_.map(settings, 'unit'));
  // Remove duplicate
  missingKeys = _.compact(_.uniq(missingKeys));

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
      missingKeys.forEach( key=> json[key] = json[key] || labels[key] || '' );
      // Return the modified json
      return json;
    }))
    .pipe(gulp.dest(i18ndest));
});
