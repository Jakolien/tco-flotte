'use strict';

export function routeConfig($urlRouterProvider, $locationProvider, $uibTooltipProvider, RestangularProvider, $translateProvider, tmhDynamicLocaleProvider, appConfig) {
  'ngInject';
  // Load current locale
  tmhDynamicLocaleProvider.localeLocationPattern(appConfig.localeLocation);
  // Configure ui-router
  $urlRouterProvider.otherwise('/');
  $locationProvider.html5Mode(false);
  // Configure tooltips and popover
  $uibTooltipProvider.setTriggers({ outsideClick: 'outsideClick' });
  $uibTooltipProvider.options({appendToBody: true});
  // Configure restangular
  RestangularProvider.setBaseUrl('/api');
  RestangularProvider.setRestangularFields({ id: "_id",  selfLink: 'self.link' });
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
}
