/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";

import { Logger } from "../helpers/logger";
import { RepoUtils } from "../helpers/repoutils";

var url = require("url");

export class RepositoryInfo {
    private _host: string;
    private _hostName: string;
    private _path: string;
    private _pathName: string;
    private _port: string;
    private _protocol: string;
    private _query: string;

    private _account: string;
    private _collection: string;
    private _collectionId: string;
    private _teamProject: string;
    private _repositoryName: string;
    private _serverUrl: string;

    // Indicates whether the repository is Team Services
    private _isTeamServicesUrl: boolean = false;
    // Indicates whether the repository is an on-premises server
    private _isTeamFoundationServer: boolean = false;

    private _repositoryId: string;

    constructor(repositoryUrl: string);
    constructor(repositoryInfo: any);

    constructor (repositoryInfo: any) {
        let repositoryUrl: string = undefined;

        if (typeof repositoryInfo === "object") {
            repositoryUrl = repositoryInfo.repository.remoteUrl;
        } else {
            repositoryUrl = repositoryInfo;
        }

        let purl = url.parse(repositoryUrl);
        if (purl != null) {
            this._host = purl.host;
            this._hostName = purl.hostName;
            this._path = purl.path;
            this._pathName = purl.pathName;
            this._port = purl.port;
            this._protocol = purl.protocol;
            this._query = purl.query;

            if (RepoUtils.IsTeamFoundationGitRepo(repositoryUrl)) {
                if (RepoUtils.IsTeamFoundationServicesRepo(repositoryUrl)) {
                    let splitHost = this._host.split(".");
                    this._account = splitHost[0];
                    this._isTeamServicesUrl = true;
                    Logger.LogDebug("_isTeamServicesUrl: true");
                } else if (RepoUtils.IsTeamFoundationServerRepo(repositoryUrl)) {
                    this._account = purl.host;
                    this._isTeamFoundationServer = true;
                }
                if (typeof repositoryInfo === "object") {
                    Logger.LogDebug("Parsing values from repositoryInfo object as any");
                    //The following properties are returned from the vsts/info api
                    //If you add additional properties to the server context, they need to be set here
                    this._collection = repositoryInfo.collection.name;
                    Logger.LogDebug("_collection: " + this._collection);
                    this._collectionId = repositoryInfo.collection.id;
                    Logger.LogDebug("_collectionId: " + this._collectionId);
                    this._repositoryId = repositoryInfo.repository.id;
                    Logger.LogDebug("_repositoryId: " + this._repositoryId);
                    this._repositoryName = repositoryInfo.repository.name;
                    Logger.LogDebug("_repositoryName: " + this._repositoryName);
                    this._teamProject = repositoryInfo.repository.project.name;
                    Logger.LogDebug("_teamProject: " + this._teamProject);
                    if (this._isTeamFoundationServer === true) {
                        Logger.LogDebug("_isTeamFoundationServer: true");
                        //_serverUrl is only set for TeamFoundationServer repositories
                        this._serverUrl = repositoryInfo.serverUrl;
                    }
                } else {
                    Logger.LogDebug("Parsing values from repositoryInfo as string url");
                }
            }
        }
    }

    public get Account(): string {
        return this._account;
    }
    public get AccountUrl(): string {
        if (this._isTeamServicesUrl) {
            return this._protocol + "//" + this._host;
        } else if (this._isTeamFoundationServer) {
            return this._serverUrl;
        }
    }
    public get CollectionId(): string {
        return this._collectionId;
    }
    public get CollectionName(): string {
        return this._collection;
    }
    public get CollectionUrl(): string {
        if (this._collection === undefined) {
            return undefined;
        }
        //While leaving the actual data alone, check for 'collection in the domain'
        if (this._account.toLowerCase() !== this._collection.toLowerCase()) {
            return this.AccountUrl + "/" + this._collection;
        } else {
            return this.AccountUrl;
        }
    }
    public get Host(): string {
        return this._host;
    }
    public get IsTeamFoundation(): boolean {
        return this._isTeamServicesUrl || this._isTeamFoundationServer;
    }
    public get IsTeamFoundationServer(): boolean {
        return this._isTeamFoundationServer;
    }
    public get IsTeamServices(): boolean {
        return this._isTeamServicesUrl;
    }
    public get RepositoryId(): string {
        return this._repositoryId;
    }
    public get RepositoryName(): string {
        return this._repositoryName;
    }
    public get RepositoryUrl(): string {
        if (this._repositoryName === undefined) {
            return undefined;
        }
        return this.TeamProjectUrl + "/_git/" + this._repositoryName;
    }
    public get TeamProjectUrl(): string {
        if (this._teamProject === undefined) {
            return undefined;
        }
        return this.CollectionUrl + "/" + this._teamProject;
    }
    public get TeamProject(): string {
        return this._teamProject;
    }
}
