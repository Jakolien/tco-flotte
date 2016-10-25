'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('main.fleets.groups', {
      url: '/groups',
      component: 'groups',
      resolve: {
        limitGroup: function($q, $state, fleet){
          'ngInject'
          let deferred = $q.defer();
          // No more than 5 not-special groups by fleet
          if( fleet.moreGroups() ) {
            deferred.resolve();
          } else {
            $state.go('main.fleets');
            deferred.reject('You can\'t add more group to this fleet.');
          }
          return deferred.promise;
        }
      }
    });
}
