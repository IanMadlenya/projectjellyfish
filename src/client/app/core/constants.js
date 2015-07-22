/* global apiCheck:false, toastr:false, moment:false, _:false, $:false */
(function() {
  'use strict';

  angular.module('app.core')
    .constant('apiCheck', apiCheck)
    .constant('lodash', _)
    .constant('jQuery', $)
    .constant('toastr', toastr)
    .constant('moment', moment);
})();
