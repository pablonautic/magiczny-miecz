import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";

import { ToasterService, ToasterConfig, Toast, BodyOutputType } from 'angular2-toaster';

import 'style-loader!angular2-toaster/toaster.css';

import { GamesApiClient } from "@Common/client/GamesApiClient";
import { GameListDto } from "@Common/dto/GameListDto";
import { GameVisibility } from "@Common/model/GameVisibility";
import { ClientServices } from "@App/ClientServices";
import { ResourceManager } from "@App/game/ResourceManager";

@Component({
    selector: 'ngx-dashboard',
    styleUrls: ["./dashboard.component.scss"],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements AfterViewInit, OnDestroy {


    public myGames: GameListDto[] = [];
    public openGames: GameListDto[] = [];

    private gamesApiClient: GamesApiClient;

    private timer: any;

    //workaround: we inject the resourceManager only to force it to be initialized
    constructor(private router: Router, private toasterService: ToasterService, private services: ClientServices, private resourceManager: ResourceManager) {
        this.gamesApiClient = new GamesApiClient(this.services);
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.load();
        }, 500);
        this.timer = setInterval(async () => await this.load(), 5000);

        this.loadDisqus();
    }

    private loadDisqus() {
        var d = document, s = d.createElement('script');
        s.src = 'https://magiczny-miecz.disqus.com/embed.js';
        s.setAttribute('data-timestamp', "" + new Date());
        (d.head || d.body).appendChild(s);
    }

    ngOnDestroy(): void {
        clearInterval(this.timer);
    }

    private async load() {
        await this.loadOpenGames();

        if (this.isUserLoggedIn()) {
            await this.loadMyGames();
        }
    }

    async loadMyGames() {
        this.myGames = await this.gamesApiClient.getMyGames().catch(r => {
            if ((r as Error).message.includes("401")) {
                this.services.clientAuthService.logoutAndNavigateToLogin(location);
            } else {
                this.services.logger.error(r);
            }
            return [];
        });
    }

    async loadOpenGames() {
        this.openGames = await this.gamesApiClient.getOpenGames();
    }

    create(): void {
        this.gamesApiClient.createGame().then(res => this.myGames.push(res));
    }

    join(game: GameListDto): void {
        this.router.navigate(["pages", "game", "online", game.id]);
    }


    delete(game: GameListDto): void {
        if (confirm("Czy na pewno usunąć grę?")) {
            this.gamesApiClient.deleteGame(game.id)
                .then(_ => {
                    this.myGames = this.myGames.filter(g => g.id !== game.id);
                });
        }
    }

    getGameUrl(game: GameListDto): string {
        return location.origin + '/#/pages/game/online/' + game.id;
    }

    isUserLoggedIn() {
        return this.services.clientAuthService.isLoggedIn();
    }

    get itemsList() {
        return GameVisibility.all;
    }

    async onItemChange(game: GameListDto) {
        await this.gamesApiClient.updateGameMetadata(game);
        this.toasterService.popAsync("success", "Hurra", "Zmiany zapisane");
    }

    res(key: string) {
        return ResourceManager.getLocalizationMessage(key);
    }

    copyToClp(txt) {
        txt = document.createTextNode(txt);
        document.body.appendChild(txt);
        var d = document.createRange();
        d.selectNodeContents(txt);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(d);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        txt.remove();
        this.toasterService.popAsync("success", ":)", "Link skopiowany do schowka");
    }
}
