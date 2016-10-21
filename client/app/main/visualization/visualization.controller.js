'use strict';
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

export default class VisualizationComponent {
  /*@ngInject*/
  constructor(fleets, $uibModal, $scope, Restangular, $timeout) {
    angular.extend(this, { fleets, $uibModal, $scope, Restangular, $timeout });
    // Bind method context
    this.openDownload = this.openDownload.bind(this);
    this.prepareDownload = this.prepareDownload.bind(this);
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
    // Remove class attribute when the modal is closed
    this.modal.result.finally( ()=> delete this.modal );
    // Start preparing visualizations one by one
    this.prepareDownload();
  }
  prepareDownload() {
    let ids = this.fleets.ids.join(',');
    // Get print status
    this.Restangular.all('fleets').one('print').get({ ids: ids }).then(function(print) {
      // Modal is closed!
      if(!this.modal) return;
      // Update scope's print property
      angular.extend(this, { print });
      // Is the file ready?
      if(print.status === 'done') {
        // Download!
        window.location = print.url;
      } else {
        // Not yet, we check in 1 second
        this.$timeout(this.prepareDownload, 1000);
      }
    }.bind(this));
  }
}
