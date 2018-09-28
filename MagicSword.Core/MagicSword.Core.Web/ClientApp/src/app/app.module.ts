import { BrowserModule } from "@angular/platform-browser";
import { NgModule, LOCALE_ID } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AppComponent } from "./app.component";
import { NavMenuComponent } from "./nav-menu/nav-menu.component";
import { HomeComponent } from "./home/home.component";
import { GameComponent } from "./game/game.component";
import { CounterComponent } from "./counter/counter.component";
import { LobbyComponent } from "./lobby/lobby.component";
import { LoginComponent } from "./login/login.component";

import { Services } from "@App/Services";
import { AuthService } from "@App/AuthService";
import { SocketClient } from "@App/SocketClient"
import { ResourceManager } from "@App/game/ResourceManager";

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        HomeComponent,
        GameComponent,
        CounterComponent,
        LobbyComponent,
        LoginComponent,
    ],
    imports: [
        BrowserModule.withServerTransition({ appId: "ng-cli-universal" }),
        HttpClientModule,
        FormsModule,
        RouterModule.forRoot([
            { path: "", component: HomeComponent, pathMatch: "full" },
            { path: "game/:mode/:gameId", component: GameComponent },
            { path: "game/:mode", component: GameComponent },
            { path: "counter", component: CounterComponent },
            { path: "lobby", component: LobbyComponent },
            { path: "login", component: LoginComponent },
        ]),
        NgbModule.forRoot()
    ],
    providers: [
        { provide: LOCALE_ID, useValue: "en-US" },
        AuthService,
        Services,
        SocketClient,
        ResourceManager
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
