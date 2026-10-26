import { FooterComponent } from './footer.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-base-footer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './base-footer.component.html',
  styleUrl: './base-footer.component.scss'
})
export class BaseFooterComponent extends FooterComponent {}
