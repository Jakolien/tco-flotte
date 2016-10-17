'use strict';
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

export default class VisualizationComponent {
  /*@ngInject*/
  constructor(fleets, $uibModal, $q, $scope, $window) {
    angular.extend(this, { fleets, $uibModal, $q, $scope, $window });
    // Bind method context
    this.openDownload = this.openDownload.bind(this);
    this.prepareDownload = this.prepareDownload.bind(this);
    this.loadImage = this.loadImage.bind(this);
    // Filter enabled display
    this.display = _.filter(this.display, { enable: true });
    // Basic information and summaries
    this.summaries = _.filter(this.settings, { report: 'Summary' });
    this.basics = _.filter(this.settings, { report: 'Basic information for the calculation' });
    // Number of image to download (null until we start the download)
    this.imagesLeft = null;
  }
  openDownload() {
    this.modal = this.$uibModal.open({
      template: require('./download.pug'),
      size: 'sm',
      scope: this.$scope,
      controllerAs: '$ctrl'
    });
    // Start preparing visualizations one by one
    this.prepareDownload();
  }
  prepareDownload(display = this.display) {
    this.imagesLeft = display.length;
    if(display[0]) {
      this.loadImage(display[0]).then(function() {
        // Go to the next
        this.prepareDownload(display.slice(1));
      }.bind(this), function() {
        // Try again!
        this.prepareDownload(display);
      }.bind(this));
    } else {
      // Download!
      this.$window.location = '/api/fleets/print';
    }
  }
  loadImage(meta) {
    // Create a promise
    let defered = this.$q.defer();
    // Build the image url
    let url = `/api/fleets/png/${meta.name}`;
    // Create an image
    let $image = $("<img>");
    // Resolve the promise when the image is loaded
    $image.on('load', defered.resolve);
    $image.on('error', defered.reject);
    // Set the image URL
    $image.attr('src', url);
    // Returns the promise
    return defered.promise;
  }
}
