'use strict';
// uses sinon but can't import because sinon uses dynamic requires
// sinon types will be resolved from tsd.d.ts
var _ = require('lodash');
var q = require('q');
var Mock = (function () {
    function Mock() {
    }
    Mock.prototype.service = function (service) {
        if (_.isUndefined(service)) {
            service = {};
        }
        service._mock_requestList_ = [];
        return service;
    };
    Mock.prototype.promise = function (service, methodName, data, successful) {
        // Default successful to true
        if (_.isUndefined(successful)) {
            successful = true;
        }
        service[methodName] = sinon.spy(function () {
            var deferred = q.defer();
            service._mock_requestList_.push({
                promise: deferred,
                data: data,
                successful: successful,
            });
            return deferred.promise;
        });
    };
    Mock.prototype.promiseWithCallback = function (service, methodName, callback, successful) {
        var _this = this;
        // Default successful to true
        if (_.isUndefined(successful)) {
            successful = true;
        }
        service[methodName] = sinon.spy(function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i - 0] = arguments[_i];
            }
            var deferred = q.defer();
            service._mock_requestList_.push({
                promise: deferred,
                data: callback.apply(_this, params),
                successful: successful,
            });
            return deferred.promise;
        });
    };
    Mock.prototype.flush = function (service, scope) {
        // Save local reference to the request list and then clear
        var currentPendingRequests = service._mock_requestList_;
        service._mock_requestList_ = [];
        // Process the saved list.
        // This way if any additional requests are generated while processing the current / local list
        //  these requests will be queued until the next call to flush().
        _.each(currentPendingRequests, function (request) {
            if (request.successful) {
                request.promise.resolve(request.data);
            }
            else {
                request.promise.reject(request.data);
            }
            if (_.isUndefined(scope) === false) {
                scope.$digest();
            }
        });
    };
    return Mock;
})();
exports.mock = new Mock();
//# sourceMappingURL=mock.js.map