'use strict';
import _        from 'lodash';
import uiRouter from 'angular-ui-router';
import auth     from '../components/auth/auth.module';

export default angular.module('oekoFlotteApp.route', [uiRouter, auth])
  .config(function($urlRouterProvider, $locationProvider) {
    'ngInject';
    // Configure ui-router
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(false);
  })
  .run(function($state, $transitions) {
    'ngInject';
    // Are we allowed to access this state?
    $transitions.onSuccess({}, function(transition) {
      // Restrict to fleet with groups left
      if( $state.is('main.fleets.groups') && !transition.injector().get('fleet').moreGroups() ) {
        return $state.go('main.fleets');
      }
    });
  })
  .run(function($transitions, $location, Auth) {
    'ngInject';
    // Redirect unlogged user to the right page
    $transitions.onSuccess({}, function(transition) {
      Auth.isLoggedIn(function(loggedIn) {
        if(transition.targetState().authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  })
  .run(function($transitions, $q, fleets, $uibModal) {
    'ngInject';
    // Confirm transition from main.fleets to main.visualization
    $transitions.onBefore({  from: 'main.fleets', to: 'main.visualization' }, function(transition) {
      // Find original path node
      let pathNode = transition.treeChanges().from.slice(-1)[0]
      // Find the fleet
      let fleet    = _.find(pathNode.resolvables, { token: 'fleet' }).data;
      // Are we comparing fleets?
      if(fleets.compared && fleets.compared.TCO.mileage_with_savings !== fleet.TCO.mileage_with_savings) {
        return $uibModal.open({
          template: require('./main/fleets/confirm.pug'),
          size: 'md',
          controllerAs: '$ctrl',
          controller: function($uibModalInstance) {
            'ngInject';
            // An array of sorted values
            let sorted = [fleet, fleets.compared].sort(( a, b)=> a.TCO.mileage_with_savings - b.TCO.mileage_with_savings);
            // Comparaison values
            this.deltaValues = {
              biggest: sorted[1],
              smallest: sorted[0],
              delta: sorted[1].TCO.mileage_with_savings - sorted[0].TCO.mileage_with_savings
            };
            // Modal helpers
            this.ok = $uibModalInstance.close;
            this.dismiss = $uibModalInstance.dismiss;
          }
        // Return the promise
        }).result;
      }
    });
  })
  .run(function($transitions, $rootScope, $state, $window, $location) {
    'ngInject';
    // Redirect to login if route requires auth and you're not logged in
    $transitions.onSuccess({}, function(transition) {
      // Go up
      $window.scrollTo(0, 0);
      // Send 'pageview' to Google Analytics
      $window.ga('send', 'pageview', {page: $location.url() });
      // Helper to find the title within the state's resolve
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
      $rootScope.$title = getTitleResolvable(transition) ? transition.injector().get('$title') : undefined;
      // Build breadcrumbs
      $rootScope.$breadcrumbs = transition.treeChanges().to.map(bc).filter(angular.identity);
  	});
  })
  .name;
