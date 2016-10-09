'use strict';

import angular     from 'angular';
import ngAnimate   from 'angular-animate';
import ngCookies   from 'angular-cookies';
import ngResource  from 'angular-resource';
import ngSanitize  from 'angular-sanitize';
import uiRouter    from 'angular-ui-router';
import uiBootstrap from 'angular-ui-bootstrap';
import ngTranslate from 'angular-translate';
import ngSlider    from 'angularjs-slider';
import restangular from 'restangular'
import stickyfill  from 'Stickyfill/dist/stickyfill';

import { routeConfig }      from './app.config';
import auth                 from '../components/auth/auth.module';
import dynamicInput         from '../components/dynamic-input/dynamic-input.module';
import fleets               from '../components/fleets/fleets.module';
import util                 from '../components/util/util.module';
import navbar               from '../components/navbar/navbar.component';
import footer               from '../components/footer/footer.component';
import sticky               from '../components/sticky/sticky.module';
import main                 from './main/main.component';
import mainFleets           from './main/fleets/fleets.component';
import mainFleetsGroups     from './main/fleets/groups/groups.component';
import mainFleetsGroupsEdit from './main/fleets/groups/edit/edit.component';
import mainVisualization    from './main/visualization/visualization.component';
import account              from './account';
import constants            from './app.constants';

import './app.scss';

angular.module('oekoFlotteApp', [
  ngCookies,
  ngAnimate,
  ngResource,
  ngSanitize,
  uiRouter,
  uiBootstrap,
  ngTranslate,
  ngSlider,
  'restangular',
  auth,
  account,
  navbar,
  footer,
  sticky,
  main,
  mainFleets,
  mainFleetsGroups,
  mainFleetsGroupsEdit,
  mainVisualization,
  constants,
  util,
  dynamicInput,
  fleets
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
