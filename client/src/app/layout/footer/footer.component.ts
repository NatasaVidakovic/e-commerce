import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { SiteConfigService } from '../../core/services/site-config.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private siteConfigService = inject(SiteConfigService);

  config = this.siteConfigService.siteConfig;
  currentYear = new Date().getFullYear();
}
