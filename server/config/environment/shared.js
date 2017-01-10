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
  colors: [ "#3288bd", "#ffffbf", "#9e0142", "#abdda4", "#fdae61", "#66c2a5",  "#d53e4f", "#e6f598", "#5e4fa2", "#fee08b", "#f46d43"],
  // Angular Locale
  localeLocation: 'https://code.angularjs.org/1.2.20/i18n/angular-locale_{{locale}}.js'
};
