import { Component } from '@angular/core';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">Created by <a href="mailto:contact@plgc.eu">Paweł Gorczyński</a> 2018</span>
    <div class="socials">
      <a href="https://github.com/pablonautic/magiczny-miecz" target="_blank" class="ion ion-social-github"></a>
      <a href="https://www.linkedin.com/in/pawelgorczynski/" target="_blank" class="ion ion-social-linkedin"></a>
    </div>
  `,
})
export class FooterComponent {
}
