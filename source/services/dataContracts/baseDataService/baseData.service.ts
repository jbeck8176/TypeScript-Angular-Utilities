'use strict';

import * as angular from 'angular';
import * as _ from 'lodash';

import { IArrayUtility, serviceName as arrayServiceName, moduleName as arrayModuleName } from '../../array/array.service';

export var moduleName: string = 'rl.utilities.services.baseDataService';
export var factoryName: string = 'baseDataService';

export interface IBaseDomainObject {
    id: number;
}

export interface IBaseDataService<TDataType extends IBaseDomainObject, TSearchParams> {
	getList(params?: TSearchParams): angular.IPromise<TDataType[]>;
    getDetail(id: number): angular.IPromise<TDataType>;
    create(domainObject: TDataType): angular.IPromise<TDataType>;
    update(domainObject: TDataType): angular.IPromise<void>;
    delete(domainObject: TDataType): angular.IPromise<void>;
}

export class BaseDataService<TDataType extends IBaseDomainObject, TSearchParams> implements IBaseDataService<TDataType, TSearchParams> {
    constructor(private $http: angular.IHttpService
            , private $q: angular.IQService
            , private array: IArrayUtility
            , private endpoint: string
            , private mockData: TDataType[]
            , public useMock: boolean) { }

    // Build request URL
    private getEndpoint(): string {
        return this.endpoint;
    }

    private getItemEndpoint(id: number): string {
        return this.endpoint + '/' + id.toString();
    }

    getList(params: TSearchParams): angular.IPromise<TDataType[]> {
        if (this.useMock) {
            return this.$q.when(this.mockData);
        } else {
            return this.$http.get(this.getEndpoint(), { params: params })
                .then((response: angular.IHttpPromiseCallbackArg<TDataType[]>): TDataType[] => {
                return response.data;
            });
        }
    }

    getDetail(id: number): angular.IPromise<TDataType> {
        if (this.useMock) {
            return this.$q.when(_.find(this.mockData, (item: TDataType): boolean => {
                return item.id === id;
            }));
        } else {
            return this.$http.get(this.getItemEndpoint(id))
                .then((response: angular.IHttpPromiseCallbackArg<TDataType>): TDataType => {
                return response.data;
            });
        }
    }

    create(domainObject: TDataType): angular.IPromise<TDataType> {
        if (this.useMock) {
            this.mockData.push(domainObject);
            return this.$q.when(domainObject);
        } else {
            return this.$http.post(this.getEndpoint(), JSON.stringify(domainObject))
                .then((result: angular.IHttpPromiseCallbackArg<TDataType>): TDataType => {
                return result.data;
            });
        }
    }

    update(domainObject: TDataType): angular.IPromise<void> {
        if (this.useMock) {
            let oldObject: TDataType = _.find(this.mockData, _.find(this.mockData, (item: TDataType): boolean => {
                return item.id === domainObject.id;
            }));
            oldObject = <TDataType>_.assign(oldObject, domainObject);
            return this.$q.when();
        } else {
            return this.$http.put<void>(this.getItemEndpoint(domainObject.id), domainObject).then((): void => { return null; });
        }
    }

    delete(domainObject: TDataType): angular.IPromise<void> {
        if (this.useMock) {
            this.array.remove(this.mockData, domainObject);
            return this.$q.when();
        } else {
            return this.$http.delete<void>(this.getItemEndpoint(domainObject.id)).then((): void => { return null; });
        }
    }
}

export interface IBaseDataServiceFactory {
    getInstance<TDataType extends IBaseDomainObject, TSearchParams>(endpoint: string, mockData?: TDataType[], useMock?: boolean): IBaseDataService<TDataType, TSearchParams>;
}

baseDataServiceFactory.$inject = ['$http', '$q', arrayServiceName];
export function baseDataServiceFactory($http: angular.IHttpService, $q: angular.IQService, array: IArrayUtility): IBaseDataServiceFactory {
    return {
        getInstance<TDataType extends IBaseDomainObject, TSearchParams>(endpoint: string, mockData?: TDataType[], useMock?: boolean): IBaseDataService<TDataType, TSearchParams> {
            return new BaseDataService<TDataType, TSearchParams>($http, $q, array, endpoint, mockData, useMock);
        },
    };
}

angular.module(moduleName, [arrayModuleName])
    .factory(factoryName, baseDataServiceFactory);
