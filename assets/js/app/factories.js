/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */

'use strict';

var apiRoutes = require ('apiRoutes');
var angular = require('angular');
var _ = require('lodash');

module.exports = angular.module('broker.factories', [])
  .factory('ApiResource', ['AppConfig', function(AppConfig) {

    // Get the data from the config if it has been passed in, otherwise use the default
    // from the apiRoutes.json file.
    var apiBasePath = AppConfig.get('apiBasePath') || apiRoutes.basePath;

    // Remove trailing slash if it exists.
    apiBasePath = apiBasePath.replace(/\/$/, "");

    return function(apiResourceKey) {
      if (_.isEmpty(apiResourceKey)) {
        return apiBasePath;
      }
      return apiBasePath + apiRoutes.routes[apiResourceKey];
    };
  }])
  // resource for Solution
  .factory('Solution', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('solutions'));
  }])
  // resource for general data
  .factory('DataService', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource(), {}, {
      getProjectQuestions: {
        method: "GET",
        isArray: true,
        url: ApiResource('projectQuestions')
      },
      createProject: {
        method: "POST",
        url: ApiResource('createProject')
      },
      getManageValues: {
        method: "GET",
        url: ApiResource('manageValues')
      },
      getMarketplaceValues: {
        method: "GET",
        url: ApiResource('marketplaceValues')
      },
      getAlerts: {
        method: "GET",
        isArray: true,
        url: ApiResource('alerts')
      }
    });
  }])
  // resource for User
  .factory('User', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('usersById'), {}, {
      getRecentUsers: {
        method: "GET",
        isArray: true,
        url: ApiResource('recentUsers')
      },
      getCurrentMember: {
        method: 'GET',
        isArray: false,
        url: ApiResource('currentMember')
      }
    });
  }])
  // resource for Order
  .factory('Order', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('ordersById'), {}, {
      getRecentOrders: {
        method: "GET",
        isArray: true,
        url: ApiResource('recentOrders')
      }
    });
  }])
  // resource for Project
  .factory('Project', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('projectsById'));
  }])
  // resource for Service
  .factory('Service', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('servicesById'));
  }])
  // resource for Application
  .factory('Application', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('applicationsById'));
  }])
  // resource for Bundle
  .factory('Bundle', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('bundlesById'));
  }])
  // resource for data displayed in header (notifications and basket count)
  .factory('HeaderData', ['$resource', 'ApiResource', function($resource, ApiResource) {
    return $resource(ApiResource('header'));
  }])
  // fix sidebar height
  .factory('fixSidebar', [function() {
    return function() {
      var $nav = $('.side-nav');
      var $footer = $('footer');

      // If the nav is shown (only shown when logged in) we resize the nav to the correct size based
      // on page content.
      if ($nav && $nav.is(":visible")) {
        $nav.height(500);

        var headerAndFooterHeight = $('header').outerHeight() + $footer.outerHeight();
        var mainContentEl = $('.main-content');

        if ((mainContentEl.height() + headerAndFooterHeight) < document.documentElement.clientHeight) {
          $nav.height(document.documentElement.clientHeight - headerAndFooterHeight);
        } else {
          $nav.height(mainContentEl.height());
          $footer.css('position', '');
        }
      } else {
        // If there is no visible sidebar, we set the footer to absolute to make sure it stays on the bottom.
        $footer.css('position', 'absolute');
      }
    };
  }])
  .factory('httpInterceptor', ['$rootScope', '$q', '$location', function($rootScope, $q, $location) {

    return function (promise) {
      var success = function (response) {
        return response;
      };

      var error = function (response) {
        if (response.status === 401) {
          $location.path('/logout');
        }

        return $q.reject(response);
      };

      return promise.then(success, error);
    };
  }])
  .factory('AuthService', ['$rootScope', '$http', '$location', 'Session', 'ApiResource', 'USER_ROLES',
    function ($rootScope, $http, $location, Session, ApiResource, USER_ROLES) {
      var authService = {};

      authService.login = function (credentials) {
        return $http
          .post(ApiResource('signIn'), credentials)
          .success(function (data, statusCode) {
            Session.create(data.email, data.role);
          })
          .error(function() {
            // Do error here.
          })
      };

      // @todo need to call sign_out endpoint.
      authService.logout = function() {
        return $http
          .delete(ApiResource('signOut'))
          .success(function() {
            $rootScope.headerData = null;
            Session.destroy();
            $location.path('/');
          });
      };

      // @todo Need to check the cookie here and then regrab the session data.
      authService.isAuthenticated = function () {
        return !!Session.email;
      };

      authService.isAuthorized = function (authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
          authorizedRoles = [authorizedRoles];
        }

        // If authorizedRoles contains 'all', then we allow it through.
        if (authorizedRoles.indexOf(USER_ROLES.all) !== -1) {
          return true;
        } else {
          return (authService.isAuthenticated() && authorizedRoles.indexOf(Session.role) !== -1);
        }
      };

      return authService;
    }])
  .service('Session', function () {
    this.create = function (email, role) {
      this.email = email;
      this.role = role;
    };
    this.destroy = function () {
      this.email = null;
      this.role = null;
    };
    return this;
  })
  .service('AppConfig', function() {

    if (!this.appConfig) {
      try {
        this.appConfig = JSON.parse(window.appConfig);
      } catch(error) {
        $log.error('Error parsing appConfig: ' + error);
      }
    }

    this.get = function(key) {
      if (key in this.appConfig) {
        return this.appConfig[key];
      }
      return undefined;
    }
  });