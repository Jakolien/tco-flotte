'use strict';

export default function routes($stateProvider) {
  'ngInject';

  $stateProvider.state('logout', {
    url: '/logout?referrer',
    referrer: 'main',
    template: '<div></div>',
    controller($state, Auth, fleets) {
      'ngInject';
      // Find referer
      var referrer = $state.params.referrer || $state.current.referrer || 'main';
      // Destroy the session
      Auth.logout();
      // Purge the fleets list
      fleets.purge();
      // Redirect to the referrer
      $state.go(referrer);
    }
  })
  .state('login', {
    url: '/login',
    template: require('./login/login.pug'),
    controller: 'LoginController',
    controllerAs: 'vm'
  })
  .state('forgot', {
    url: '/forgot',
    template: require('./forgot/forgot.pug'),
    controller: 'ForgotController',
    controllerAs: 'vm'
  })
  .state('reset', {
    url: '/reset/:token',
    template: require('./reset/reset.pug'),
    controller: 'ResetController',
    controllerAs: 'vm'
  })
  .state('signup', {
    url: '/signup',
    template: require('./signup/signup.pug'),
    controller: 'SignupController',
    controllerAs: 'vm'
  })
  .state('settings', {
    url: '/settings',
    template: require('./settings/settings.pug'),
    controller: 'SettingsController',
    controllerAs: 'vm',
    authenticate: true
  });
}
