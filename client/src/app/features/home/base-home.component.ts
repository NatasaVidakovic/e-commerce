import { HomeComponent } from './home.component';
import { Component } from '@angular/core';

import { ProductItemComponent } from '../shop/product-item/product-item.component';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { RouterModule } from '@angular/router';

import { CurrencyPipe } from '../../shared/pipes/currency.pipe';

import { SwiperDirective } from '../../shared/directives/swiper.directive';

@Component({
  selector: 'app-base-home',
  imports: [
    ProductItemComponent,
    TranslatePipe,
    CommonModule,
    RouterModule,
    SwiperDirective,
    CurrencyPipe
  ],
  templateUrl: './base-home.component.html',
  styleUrls: ['./base-home.component.scss']
})
export class BaseHomeComponent extends HomeComponent {}
