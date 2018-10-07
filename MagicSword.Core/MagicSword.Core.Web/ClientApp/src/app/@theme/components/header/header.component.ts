import { Component, Input, OnInit } from '@angular/core';

import { NbMenuService, NbSidebarService } from '@nebular/theme';
import { UserService } from '../../../@core/data/users.service';
import { AnalyticsService } from '../../../@core/utils/analytics.service';
import { Services } from "@App/Services";

@Component({
    selector: 'ngx-header',
    styleUrls: ['./header.component.scss'],
    templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {


    @Input() position = 'normal';

    user: any;

    userMenu = [{ title: 'Profile' }, { title: 'Log out' }];

    constructor(private sidebarService: NbSidebarService,
        private menuService: NbMenuService,
        private userService: UserService,
        private analyticsService: AnalyticsService,
        private services: Services) {
    }

    userName(): string {
        var user = this.services.authService.user;
        return user ? user.nickname : "Niezalogowany";
    }

    ngOnInit() {
        this.userService.getUsers()
            .subscribe((users: any) => this.user = users.nick);
    }

    toggleSidebar(): boolean {
        this.sidebarService.toggle(true, 'menu-sidebar');
        return false;
    }

    toggleSettings(): boolean {
        this.sidebarService.toggle(false, 'settings-sidebar');
        return false;
    }

    goToHome() {
        this.menuService.navigateHome();
    }

    startSearch() {
        this.analyticsService.trackEvent('startSearch');
    }
}
