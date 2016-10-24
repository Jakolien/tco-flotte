'use strict';

import angular       from 'angular';
import ngAnimate     from 'angular-animate';
import ngCookies     from 'angular-cookies';
import ngResource    from 'angular-resource';
import ngSanitize    from 'angular-sanitize';
import uiBootstrap   from 'angular-ui-bootstrap';
import uiRouter      from 'angular-ui-router';
import ngSlider      from 'angularjs-slider';
import stickyfill    from 'Stickyfill/dist/stickyfill';
import duScroll      from 'angular-scroll';
import 'angular-bootstrap-colorpicker';
import 'restangular';
import 'angular-bootstrap-confirm';
import 'angular-dynamic-locale';
// Angular translate deps
import ngTranslate       from 'angular-translate';
import ngTranslateFiles  from 'angular-translate-loader-static-files';
import ngTranslateCookie from 'angular-translate-storage-cookie';
import ngTranslateLocal  from 'angular-translate-storage-local';
// C3 angular
import c3 from 'c3';
import d3 from 'd3';
import 'c3-angular';
// Export for others scripts to use
[window.c3, window.d3] = [c3, d3];

import { routeConfig } from './app.config';
import auth            from '../components/auth/auth.module';
import dynamicInput    from '../components/dynamic-input/dynamic-input.module';
import fleetsService   from '../components/fleets/fleets.module';
import util            from '../components/util/util.module';
import navbar          from '../components/navbar/navbar.component';
import footer          from '../components/footer/footer.component';
import sticky          from '../components/sticky/sticky.module';
import main            from './main/main.component';
import fleets          from './main/fleets/fleets.component';
import fleetsChartCo2  from './main/fleets/chart-co2/chart-co2.component';
import roups           from './main/fleets/groups/groups.component';
import edit            from './main/fleets/groups/edit/edit.component';
import visualization   from './main/visualization/visualization.component';
import chart           from './main/visualization/chart/chart.component';
import chartGrouped    from './main/visualization/chart-grouped/chart-grouped.component';
import print           from './print/print.component';
import account         from './account';
import constants       from './app.constants';

import './app.scss';


angular.module('oekoFlotteApp', [
  ngCookies,
  ngAnimate,
  ngResource,
  ngSanitize,
  ngTranslate,
  ngSlider,
  uiBootstrap,
  uiRouter,
  duScroll,
  'restangular',
  'colorpicker.module',
  'gridshore.c3js.chart',
  'mwl.confirm',
  'tmh.dynamicLocale',
  auth,
  account,
  navbar,
  footer,
  sticky,
  main,
  fleets,
  fleetsChartCo2,
  roups,
  edit,
  visualization,
  chart,
  chartGrouped,
  print,
  util,
  dynamicInput,
  fleetsService
])
.config(routeConfig)
.run(function($transitions, $location, Auth, $rootScope, $timeout, $state, $window, tmhDynamicLocale, $translate) {
  'ngInject';
  // Redirect to login if route requires auth and you're not logged in
  $transitions.onSuccess({}, function(transition) {

    $window.scrollTo(0, 0);

    function getTitleResolvable(comp) {
      // comp is a Transition
      if(angular.isFunction(comp.getResolveTokens)) {
        return comp.getResolveTokens().find( r=> r === '$title');
      // comp is a PathNode
      } else {
        return comp.resolvables.find( r=> r.token === '$title');
      }
    }

    // Resolve breadcrumbs.
    function bc(pathNode) {
      let titleResolvable = getTitleResolvable(pathNode);
      return !titleResolvable ? null : {
        title: titleResolvable.data,
        state: pathNode.state,
        href: $state.href(pathNode.state)
      };
    }
    // Resolve title.
    $rootScope.$title = getTitleResolvable(transition) ? transition.getResolveValue('$title') : undefined;
    // Build breadcrumbs
    $rootScope.$breadcrumbs = transition.treeChanges().to.map(bc).filter(angular.identity);
    // Change locale when chaning language
    tmhDynamicLocale.set($translate.use());
    $rootScope.$on('$translateChangeSuccess', function(ev, data){
      tmhDynamicLocale.set(data.language);
    });

    Auth.isLoggedIn(function(loggedIn) {
      if(transition.targetState().authenticate && !loggedIn) {
        $location.path('/login');
      }
    });
	});

	function getTitleValue(title) {
		return angular.isFunction(title) ? title() : title;
	}
});

angular.element(document)
  .ready(() => {
    angular.bootstrap(document, ['oekoFlotteApp'], { strictDi: true });
  });
