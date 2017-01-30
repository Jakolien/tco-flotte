'use strict';
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

export default class VisualizationComponent {
  /*@ngInject*/
  constructor(fleets, $uibModal, $scope, Restangular, $timeout, $translate, DynamicInput) {
    angular.extend(this, { fleets, $uibModal, $scope, Restangular, $timeout });
    // Bind method context
    this.openDownload    = this.openDownload.bind(this);
    this.prepareDownload = this.prepareDownload.bind(this);
    this.fleetNames      = this.fleetNames.bind(this);
    this.fleetNamesStr   = this.fleetNamesStr.bind(this);
    // Filter enabled display
    this.display = _.filter(this.display, {visualization: true});
    // Display overview
    this.findings = _.chain(this.display)
      .filter({overviewoffindings: true})
      .sortBy('overviewoffindingsrank')
      .reduce((res, meta) => {
        // One single parameters
        if (meta.type === 'bar') {
          // At least one fleet must have non-zero value for this meta
          if (_.some(this.fleets.all(), f => f.TCO[meta.name] > 0)) {
            res.push(meta);
          }
        // We must have at least one fleet to
        } else if (fleets.length()) {
          // Create an new line for each key
          let metas = _.chain(fleets.first.TCO[meta.name]).keys()
            // Only key with value
            .filter((key, n) => {
              // At least one fleet must have non-zero value for this key
              return _.some(this.fleets.all(), fleet=>{
                return fleet.TCO[meta.name][key] > 0;
              });
            })
            .map((key, n) => {
              return angular.extend({key, first: n === 0}, meta);
            }).value();
          // Add the new metas
          res = res.concat(metas);
        }
        // Return the modfied array
        return res;
      }, []).value();
    // Basic information and summaries
    this.inputs    = _.map(this.settings,   meta=> new DynamicInput(meta));
    this.summaries = _.filter(this.inputs, input=> input.meta.report === 'Summary');
    this.basics    = _.filter(this.inputs, input=> input.meta.report === 'Basic information for the calculation');
    // To display the date
    this.now = new Date();
  }
  isNumber(value) {
    return angular.isNumber(value);
  }
  fleetNames() {
    return this.fleets.all().map(f => f.name);
  }
  fleetNamesStr() {
    return this.fleetNames().join(', ');
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
