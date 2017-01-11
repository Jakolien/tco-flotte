'use strict';
/*
var ColorScheme = require('color-scheme');
// Create a color scheme
var scheme = new ColorScheme();
// Start the scheme
scheme.from_hue(223)
  // Use the 'triade' scheme, that is, colors
  // selected from 3 points equidistant around
  // the color wheel.
  .scheme('triade')
  // Use the 'soft' color variation
  .variation('soft')
  .web_safe(true);

scheme.colors().map(c=> "#" + c)
*/

exports = module.exports = {
  // List of user roles
  userRoles: ['guest', 'user', 'admin'],
  // Default palette
  colors: [
    '#053061',
    '#bf812d',
    '#40004b',
    '#2166ac',
    '#b2182b',
    '#00441b',
    '#ec7014',
    '#67001f',
    '#3288bd',
    '#d6604d',
    '#003c30',
    '#8c510a',
    '#35978f',
    '#543005',
    '#1b7837',
    '#9970ab',
    '#993404',
    '#01665e',
    '#762a83',
    '#cc4c02',
    '#5aae61',
    '#662506'
  ],
  // Angular Locale
  localeLocation: 'https://code.angularjs.org/1.2.20/i18n/angular-locale_{{locale}}.js',
  // Groups natural order
  frozenGroups: [
    "net_acquisition_cost",
    "charging_infrastructure",
    "fixed_costs",
    "energy_costs",
    "variable_costs"
  ]
};
