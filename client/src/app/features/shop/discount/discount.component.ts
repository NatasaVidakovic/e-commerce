import { Component, Input } from '@angular/core';
import { Discount } from '../../../shared/models/discount';

@Component({
  selector: 'app-discount-card',
  templateUrl: './discount.component.html',
  styleUrls: ['./discount.component.scss']
})
export class DiscountCardComponent {
  @Input() discount!: Discount;
}
