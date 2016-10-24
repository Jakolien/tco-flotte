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
  colors: ["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"],
  // Angular Locale
  localeLocation: 'https://code.angularjs.org/1.2.20/i18n/angular-locale_{{locale}}.js'
};
