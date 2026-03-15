import { Component, Input, inject } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyService } from '../../../core/services/currency.service';

export interface ReportColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date';
  width?: string;
}

export interface ReportData {
  [key: string]: any;
}

export interface SummaryMetric {
  key: string;
  label: string;
  value: string | number;
  change?: string;
}

@Component({
  selector: 'app-universal-report',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [DatePipe],
  templateUrl: './universal-report.component.html',
  styleUrls: ['./universal-report.component.scss']
})
export class UniversalReportComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() columns: ReportColumn[] = [];
  @Input() data: ReportData[] = [];
  @Input() summaryMetrics: SummaryMetric[] = [];
  @Input() loading: boolean = false;

  private currencyService = inject(CurrencyService);

  constructor(
    private datePipe: DatePipe
  ) {}

  getDisplayValue(value: any, column: ReportColumn): string {
    if (value === null || value === undefined) return '';
    
    switch (column.type) {
      case 'currency':
        return typeof value === 'number' ? this.currencyService.formatCurrency(value) : value;
      case 'date':
        return this.datePipe.transform(value, 'yyyy-MM-dd') || value;
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return String(value);
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
