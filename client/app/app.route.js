'use strict';
import uiRouter from 'angular-ui-router';
import auth     from '../components/auth/auth.module';

export default angular.module('oekoFlotteApp.route', [uiRouter, auth])
  .config(function($urlRouterProvider, $locationProvider) {
    'ngInject';
    // Configure ui-router
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(false);
  })
  .run(function($transitions, $location, Auth, $rootScope, $state, $window) {
    'ngInject';
    // Redirect to login if route requires auth and you're not logged in
    $transitions.onSuccess({}, function(transition) {
      $window.scrollTo(0, 0);
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
      $rootScope.$title = getTitleResolvable(transition) ? transition.getResolveValue('$title') : undefined;
      // Build breadcrumbs
      $rootScope.$breadcrumbs = transition.treeChanges().to.map(bc).filter(angular.identity);
      // Redirect unlogged user to the right page
      Auth.isLoggedIn(function(loggedIn) {
        if(transition.targetState().authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
  	});
  })
  .name;
