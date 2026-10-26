import { HeaderComponent } from './header.component';
import { Component } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { MatButton } from "@angular/material/button";
import { MatBadge } from "@angular/material/badge";
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { IsAdmin } from '../../shared/directives/is-admin';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-base-header',
  imports: [
    MatIcon,
    MatButton,
    MatBadge,
    RouterLink,
    RouterLinkActive,
    MatMenuTrigger,
    MatMenu,
    MatDivider,
    MatMenuItem,
    IsAdmin,
    TranslateModule
  ],
  templateUrl: './base-header.component.html',
  styleUrl: './base-header.component.scss'
})
export class BaseHeaderComponent extends HeaderComponent {}
