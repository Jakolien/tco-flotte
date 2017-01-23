'use strict';
import angular       from 'angular';
import ngAnimate     from 'angular-animate';
import ngCookies     from 'angular-cookies';
import ngResource    from 'angular-resource';
import ngSanitize    from 'angular-sanitize';
import ngSlider      from 'angularjs-slider';
import stickyfill    from 'Stickyfill/dist/stickyfill';
import duScroll      from 'angular-scroll';
import match         from 'angular-validation-match';
// C3 angular
import c3 from 'c3';
import 'c3-angular';
// Export for others scripts to use
[window.c3, window.d3] = [c3, require('d3')];

import dynamicInput    from '../components/dynamic-input/dynamic-input.module';
import fleetsService   from '../components/fleets/fleets.module';
import util            from '../components/util/util.module';
import navbar          from '../components/navbar/navbar.component';
import footer          from '../components/footer/footer.component';
import sticky          from '../components/sticky/sticky.module';
import trim            from '../components/trim/trim.filter';
import metaDisplay     from '../components/meta-display/meta-display.component';
import main            from './main/main.component';
import fleets          from './main/fleets/fleets.component';
import fleetsChartCo2  from './main/fleets/chart-co2/chart-co2.component';
import roups           from './main/fleets/groups/groups.component';
import edit            from './main/fleets/groups/edit/edit.component';
import page            from './main/page/page.component';
import visualization   from './main/visualization/visualization.component';
import chart           from './main/visualization/chart/chart.component';
import chartGrouped    from './main/visualization/chart-grouped/chart-grouped.component';
import summaryTable    from './main/visualization/summary-table/summary-table.component';
import account         from './account';
import constants       from './app.constants';
import translate       from './app.translate';
import route           from './app.route';
import config          from './app.config';

import './app.scss';

angular.module('oekoFlotteApp', [
  ngCookies,
  ngAnimate,
  ngResource,
  ngSanitize,
  ngSlider,
  duScroll,
  match,
  'colorpicker.module',
  'gridshore.c3js.chart',
  'mwl.confirm',
  account,
  navbar,
  footer,
  sticky,
  trim,
  metaDisplay,
  main,
  fleets,
  fleetsChartCo2,
  roups,
  edit,
  page,
  visualization,
  chart,
  chartGrouped,
  summaryTable,
  dynamicInput,
  fleetsService,
  util,
  route,
  translate,
  constants,
  config
]);

angular.element(document).ready(() => {
  angular.bootstrap(document, ['oekoFlotteApp'], { strictDi: true });
});
