'use strict';

import gulp from 'gulp';
import extractTranslate from 'gulp-angular-translate-extractor';
import {clientPath} from './paths';

gulp.task('locales', function () {
  var i18nsrc = [`${clientPath}/{app,components}/**/*.{pug,js,html}`];
  var i18ndest = `${clientPath}/assets/locales`;
  return gulp.src(i18nsrc)
    .pipe(extractTranslate({
      defaultLang: 'en',
        lang: ['en', 'de'],
        dest: i18ndest,
        safeMode: true,
        stringifyOptions: true
    }))
    .pipe(gulp.dest(i18ndest));
});
