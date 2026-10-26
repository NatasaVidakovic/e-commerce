import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FooterComponent } from '../footer/footer.component';
import { LumenLogoComponent } from '../../shared/components/lumen-logo/lumen-logo.component';
@Component({
  selector: 'app-lumen-footer',
  imports: [RouterLink, TranslatePipe, LumenLogoComponent],
  templateUrl: './lumen-footer.component.html',
  styleUrl: './lumen-footer.component.scss',
})
export class LumenFooterComponent extends FooterComponent {}
