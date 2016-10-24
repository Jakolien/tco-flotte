import constants from './app.constants';
// Angular translate deps
import ngTranslate from 'angular-translate';
import 'angular-translate-loader-static-files';
import 'angular-translate-storage-cookie';
import 'angular-translate-storage-local';
import 'angular-dynamic-locale';
import 'messageformat';
import 'angular-translate-interpolation-messageformat';

export default angular.module('oekoFlotteApp.translate', [ngTranslate, 'tmh.dynamicLocale', constants])
  .config(function($translateProvider, tmhDynamicLocaleProvider, appConfig) {
    'ngInject';
    // Load current locale
    tmhDynamicLocaleProvider.localeLocationPattern(appConfig.localeLocation);
    // Configure Angular Translate
    $translateProvider
      .useStaticFilesLoader({
        prefix: 'assets/locales/',
        suffix: '.json'
      })
      .registerAvailableLanguageKeys(['en', 'de'], {
        'en_US': 'en',
        'en_UK': 'en',
        'en-US': 'en',
        'en-UK': 'en',
        'de_DE': 'de'
      })
      .determinePreferredLanguage(function() {
        let lang = navigator.language || navigator.userLanguage;
        let avalaibleKeys = [
          'en_US', 'en_UK', 'en-UK', 'en-US', 'en',
          'de_DE', 'de-DE', 'de'
        ]
        return avalaibleKeys.indexOf(lang) === -1 ? 'en' : lang;
      })
      .fallbackLanguage('en')
      .useLocalStorage()
      .useSanitizeValueStrategy(null)
      .useMessageFormatInterpolation()
  })
  .run(function($rootScope, tmhDynamicLocale) {
    'ngInject';
    // Change locale when chaning language
    $rootScope.$on('$translateChangeSuccess', function(ev, data){
      tmhDynamicLocale.set(data.language);
    });
  })
  .name;
