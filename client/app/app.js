'use strict';

import angular from 'angular';
// import ngAnimate from 'angular-animate';
import ngCookies from 'angular-cookies';
import ngResource from 'angular-resource';
import ngSanitize from 'angular-sanitize';

import uiRouter from 'angular-ui-router';
import uiBootstrap from 'angular-ui-bootstrap';
// import ngMessages from 'angular-messages';
// import ngValidationMatch from 'angular-validation-match';


import {
  routeConfig
} from './app.config';

import _Auth from '../components/auth/auth.module';
import dynamicInput from '../components/dynamic-input/dynamic-input.module';
import util from '../components/util/util.module';
import navbar from '../components/navbar/navbar.component';
import footer from '../components/footer/footer.component';
import main from './main/main.component';
import mainFleets from './main/fleets/fleets.component';
import mainVisualization from './main/visualization/visualization.component';
import account from './account';
import constants from './app.constants';

import './app.scss';

angular.module('oekoFlotteApp', [
  ngCookies,
  ngResource,
  ngSanitize,
  uiRouter,
  uiBootstrap,
  _Auth,
  account,
  navbar,
  footer,
  main,
  mainFleets,
  mainVisualization,
  constants,
  util,
  dynamicInput
])
.config(routeConfig)
.run(function($rootScope, $location, Auth) {
  'ngInject';
  // Redirect to login if route requires auth and you're not logged in
  $rootScope.$on('$stateChangeStart', function(event, next) {
    Auth.isLoggedIn(function(loggedIn) {
      if(next.authenticate && !loggedIn) {
        $location.path('/login');
      }
    });
  });
});

angular.element(document)
  .ready(() => {
    angular.bootstrap(document, ['oekoFlotteApp'], { strictDi: true });
  });
