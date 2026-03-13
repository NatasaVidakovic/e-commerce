import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

import { AdminService } from '../../../../core/services/admin.service';
import { ShopService } from '../../../../core/services/shop.service';
import { environment } from '../../../../../environments/environment';
import { UniversalReportComponent, ReportColumn, ReportData, SummaryMetric } from '../../../../shared/components/universal-report/universal-report.component';
import { DynamicFilterBarComponent } from '../../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { BaseDataViewModelRequest, BaseDataViewModelResponse, DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../../shared/models/dynamic-filtering';
import { Order } from '../../../../shared/models/order';
import { Product } from '../../../../shared/models/product';
import { forkJoin } from 'rxjs';

export interface ActiveFilterChip {
  keys: string[];
  label: string;
}

@Component({
  selector: 'app-reports-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe,
    UniversalReportComponent,
    DynamicFilterBarComponent
  ],
  templateUrl: './reports-tab.component.html',
  styleUrl: './reports-tab.component.scss'
})
export class ReportsTabComponent implements OnInit {
  @ViewChild(DynamicFilterBarComponent) filterBar?: DynamicFilterBarComponent;

  constructor(
    private adminService: AdminService,
    private shopService: ShopService,
    private http: HttpClient
  ) {}

  selectedReportType: string = '';
  selectedFormat: string = 'pdf';
  loading = false;
  filterBarVisible = false;
  currentFilterValues: Record<string, any> = {};

  // Report display data
  reportColumns: ReportColumn[] = [];
  reportData: ReportData[] = [];
  reportSummaryMetrics: SummaryMetric[] = [];

  // Dynamic filtering
  filterDefinitions: DynamicFilterDefinition[] = [];
  sortOptions: DynamicSortOption[] = [];
  currentFilters: FilterViewModel[][] = [];
  currentSort: DynamicSortOption | null = null;

  // Lookup data for filter options
  productTypes: string[] = [];
  productBrands: string[] = [];

  ngOnInit(): void {
    forkJoin({
      types: this.shopService.fetchTypes(),
      brands: this.shopService.fetchBrands()
    }).subscribe({
      next: ({ types, brands }) => {
        this.productTypes = types;
        this.productBrands = brands;
      },
      error: () => {}
    });
    this.setupReportData();
  }

  get activeChips(): ActiveFilterChip[] {
    const chips: ActiveFilterChip[] = [];
    const vals = this.currentFilterValues;
    if (!vals || this.filterDefinitions.length === 0) return chips;

    const skipKeys = new Set<string>();

    for (const def of this.filterDefinitions) {
      if (def.controlType === 'dateRange') {
        const startKey = def.key + 'Start';
        const endKey = def.key + 'End';
        const startVal = vals[startKey];
        const endVal = vals[endKey];
        const hasStart = startVal !== '' && startVal !== null && startVal !== undefined;
        const hasEnd = endVal !== '' && endVal !== null && endVal !== undefined;
        if (hasStart || hasEnd) {
          const fmtDate = (v: any): string => {
            if (!v) return '';
            const d = v instanceof Date ? v : new Date(v);
            return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          };
          let label = def.label + ': ';
          if (hasStart && hasEnd) label += `${fmtDate(startVal)} \u2013 ${fmtDate(endVal)}`;
          else if (hasStart) label += `from ${fmtDate(startVal)}`;
          else label += `until ${fmtDate(endVal)}`;
          chips.push({ keys: [startKey, endKey], label });
        }
        skipKeys.add(startKey);
        skipKeys.add(endKey);
      }
    }

    for (const def of this.filterDefinitions) {
      if (skipKeys.has(def.key) || def.controlType === 'dateRange') continue;
      const raw = vals[def.key];
      const isEmpty = raw === '' || raw === null || raw === undefined ||
        (Array.isArray(raw) && raw.length === 0);
      if (isEmpty) continue;
      const displayVal = Array.isArray(raw) ? raw.join(', ') : String(raw);
      chips.push({ keys: [def.key], label: `${def.label}: ${displayVal}` });
    }

    return chips;
  }

  get hasActiveFilters(): boolean {
    return this.activeChips.length > 0;
  }

  selectReportType(reportTypeId: string): void {
    this.selectedReportType = reportTypeId;
    this.currentFilters = [];
    this.currentSort = null;
    this.currentFilterValues = {};
    this.filterBarVisible = false;
    this.setupReportData();
    setTimeout(() => { this.filterBarVisible = true; }, 0);
  }

  private setupReportData(): void {
    // Setup dynamic filters FIRST (only when report type changes)
    this.setupDynamicFilters();
    
    switch (this.selectedReportType) {
      case 'orders':
        this.setupOrdersReport();
        break;
      case 'products':
        this.setupProductsReport();
        break;
      case 'customers':
        this.setupCustomersReport();
        break;
      case 'financial':
        this.setupFinancialReport();
        break;
      case 'inventory':
        this.setupInventoryReport();
        break;
      default:
        this.clearReportData();
    }
  }

  private setupDynamicFilters(): void {
    this.filterDefinitions = [];
    this.sortOptions = [];

    switch (this.selectedReportType) {
      case 'orders':
        this.filterDefinitions = [
          {
            key: 'orderDate',
            label: 'Order Date',
            controlType: 'dateRange',
            propertyName: 'OrderDate',
            operationType: 'Equal',
            dataType: 'DateTime'
          },
          {
            key: 'status',
            label: 'Order Status',
            controlType: 'select',
            propertyName: 'Status',
            operationType: 'Equal',
            dataType: 'String',
            options: ['New', 'Confirmed', 'Preparing', 'ReadyToShip', 'Shipped', 'OutForDelivery', 'Delivered', 'Returned', 'Cancelled', 'OnHold', 'FraudReview', 'PaymentFailed', 'PaymentMismatch'],
            multiple: true
          },
          {
            key: 'customerEmail',
            label: 'Customer Email',
            controlType: 'text',
            propertyName: 'BuyerEmail',
            operationType: 'Contains',
            dataType: 'String'
          }
        ];
        this.sortOptions = [
          { label: 'Order Date (Newest)', column: 'OrderDate', ascending: false, descending: true },
          { label: 'Order Date (Oldest)', column: 'OrderDate', ascending: true, descending: false },
          { label: 'Total (High to Low)', column: 'Total', ascending: false, descending: true },
          { label: 'Total (Low to High)', column: 'Total', ascending: true, descending: false }
        ];
        break;

      case 'products':
        this.filterDefinitions = [
          {
            key: 'category',
            label: 'Category',
            controlType: 'select',
            propertyName: 'ProductType',
            firstLevel: 'Name',
            operationType: 'Equal',
            dataType: 'String',
            options: this.productTypes,
            multiple: true
          },
          {
            key: 'productName',
            label: 'Product Name',
            controlType: 'text',
            propertyName: 'Name',
            operationType: 'Contains',
            dataType: 'String'
          },
          {
            key: 'brand',
            label: 'Brand',
            controlType: 'select',
            propertyName: 'Brand',
            operationType: 'Equal',
            dataType: 'String',
            options: this.productBrands,
            multiple: true
          }
        ];
        this.sortOptions = [
          { label: 'Name (A-Z)', column: 'Name', ascending: true, descending: false },
          { label: 'Name (Z-A)', column: 'Name', ascending: false, descending: true },
          { label: 'Price (High to Low)', column: 'Price', ascending: false, descending: true },
          { label: 'Price (Low to High)', column: 'Price', ascending: true, descending: false },
          { label: 'Stock (Low to High)', column: 'QuantityInStock', ascending: true, descending: false }
        ];
        break;

      case 'customers':
        this.filterDefinitions = [
          {
            key: 'orderDate',
            label: 'Order Date',
            controlType: 'dateRange',
            propertyName: 'OrderDate',
            operationType: 'Equal',
            dataType: 'DateTime'
          },
          {
            key: 'customerEmail',
            label: 'Customer Email',
            controlType: 'text',
            propertyName: 'BuyerEmail',
            operationType: 'Contains',
            dataType: 'String'
          }
        ];
        this.sortOptions = [
          { label: 'Order Date (Newest)', column: 'OrderDate', ascending: false, descending: true },
          { label: 'Order Date (Oldest)', column: 'OrderDate', ascending: true, descending: false },
          { label: 'Total (High to Low)', column: 'Total', ascending: false, descending: true },
          { label: 'Total (Low to High)', column: 'Total', ascending: true, descending: false }
        ];
        break;

      case 'financial':
        this.filterDefinitions = [
          {
            key: 'transactionDate',
            label: 'Transaction Date',
            controlType: 'dateRange',
            propertyName: 'OrderDate',
            operationType: 'Equal',
            dataType: 'DateTime'
          },
          {
            key: 'paymentMethod',
            label: 'Payment Method',
            controlType: 'select',
            propertyName: 'PaymentType',
            operationType: 'Equal',
            dataType: 'String',
            options: ['Stripe', 'CashOnDelivery', 'PayPal', 'BankTransfer'],
            multiple: true
          },
          {
            key: 'status',
            label: 'Order Status',
            controlType: 'select',
            propertyName: 'Status',
            operationType: 'Equal',
            dataType: 'String',
            options: ['New', 'Confirmed', 'Delivered', 'Cancelled', 'Returned'],
            multiple: true
          }
        ];
        this.sortOptions = [
          { label: 'Date (Newest)', column: 'OrderDate', ascending: false, descending: true },
          { label: 'Date (Oldest)', column: 'OrderDate', ascending: true, descending: false },
          { label: 'Amount (High to Low)', column: 'Total', ascending: false, descending: true },
          { label: 'Amount (Low to High)', column: 'Total', ascending: true, descending: false }
        ];
        break;

      case 'inventory':
        this.filterDefinitions = [
          {
            key: 'category',
            label: 'Category',
            controlType: 'select',
            propertyName: 'ProductType',
            firstLevel: 'Name',
            operationType: 'Equal',
            dataType: 'String',
            options: this.productTypes,
            multiple: true
          },
          {
            key: 'productName',
            label: 'Product Name',
            controlType: 'text',
            propertyName: 'Name',
            operationType: 'Contains',
            dataType: 'String'
          },
          {
            key: 'brand',
            label: 'Brand',
            controlType: 'select',
            propertyName: 'Brand',
            operationType: 'Equal',
            dataType: 'String',
            options: this.productBrands,
            multiple: true
          },
          {
            key: 'minStock',
            label: 'Min Stock',
            controlType: 'number',
            propertyName: 'QuantityInStock',
            operationType: 'GreaterThanOrEqual',
            dataType: 'Int32'
          },
          {
            key: 'maxStock',
            label: 'Max Stock',
            controlType: 'number',
            propertyName: 'QuantityInStock',
            operationType: 'LessThanOrEqual',
            dataType: 'Int32'
          }
        ];
        this.sortOptions = [
          { label: 'Name (A-Z)', column: 'Name', ascending: true, descending: false },
          { label: 'Name (Z-A)', column: 'Name', ascending: false, descending: true },
          { label: 'Stock (Low to High)', column: 'QuantityInStock', ascending: true, descending: false },
          { label: 'Stock (High to Low)', column: 'QuantityInStock', ascending: false, descending: true }
        ];
        break;
    }
  }

  private setupOrdersReport(): void {
    this.reportColumns = [
      { key: 'id', label: 'Order ID', type: 'text' },
      { key: 'buyerEmail', label: 'Customer Email', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'total', label: 'Total', type: 'currency' },
      { key: 'orderDate', label: 'Date', type: 'date' }
    ];

    this.reportSummaryMetrics = [
      { key: 'totalOrders', label: 'Total Orders', value: '0', change: '+0%' },
      { key: 'pendingOrders', label: 'Pending Orders', value: '0', change: '+0' },
      { key: 'completedOrders', label: 'Completed Orders', value: '0', change: '+0%' }
    ];

    // Fetch real orders data
    this.fetchOrdersData();
  }

  private setupProductsReport(): void {
    this.reportColumns = [
      { key: 'id', label: 'Product ID', type: 'text' },
      { key: 'name', label: 'Product Name', type: 'text' },
      { key: 'type', label: 'Category', type: 'text' },
      { key: 'quantityInStock', label: 'Stock', type: 'number' },
      { key: 'price', label: 'Price', type: 'currency' },
      { key: 'brand', label: 'Brand', type: 'text' }
    ];

    this.reportSummaryMetrics = [
      { key: 'totalProducts', label: 'Total Products', value: '0', change: '+0' },
      { key: 'lowStock', label: 'Low Stock', value: '0', change: '0' },
      { key: 'totalValue', label: 'Total Value', value: '$0', change: '+0%' }
    ];

    // Fetch real products data
    this.fetchProductsData();
  }

  private setupCustomersReport(): void {
    this.reportColumns = [
      { key: 'name', label: 'Customer Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'orders', label: 'Orders', type: 'number' },
      { key: 'totalSpent', label: 'Total Spent', type: 'currency' },
      { key: 'joinedDate', label: 'Joined Date', type: 'date' }
    ];

    this.reportSummaryMetrics = [
      { key: 'totalCustomers', label: 'Total Customers', value: '0', change: '+0' },
      { key: 'activeCustomers', label: 'Active Customers', value: '0', change: '+0' },
      { key: 'newCustomers', label: 'New Customers', value: '0', change: '+0%' }
    ];

    // Fetch real customers data
    this.fetchCustomersData();
  }

  private setupFinancialReport(): void {
    this.reportColumns = [
      { key: 'id', label: 'Transaction ID', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'paymentType', label: 'Payment Method', type: 'text' },
      { key: 'total', label: 'Amount', type: 'currency' },
      { key: 'orderDate', label: 'Date', type: 'date' }
    ];

    this.reportSummaryMetrics = [
      { key: 'totalRevenue', label: 'Total Revenue', value: '$0', change: '+0%' },
      { key: 'totalCosts', label: 'Total Costs', value: '$0', change: '+0%' },
      { key: 'netProfit', label: 'Net Profit', value: '$0', change: '+0%' }
    ];

    // Fetch real financial data from orders
    this.fetchFinancialData();
  }

  private setupInventoryReport(): void {
    this.reportColumns = [
      { key: 'id', label: 'Product ID', type: 'text' },
      { key: 'name', label: 'Product Name', type: 'text' },
      { key: 'quantityInStock', label: 'Current Stock', type: 'number' },
      { key: 'price', label: 'Unit Cost', type: 'currency' },
      { key: 'brand', label: 'Brand', type: 'text' }
    ];

    this.reportSummaryMetrics = [
      { key: 'totalItems', label: 'Total Items', value: '0', change: '+0' },
      { key: 'totalValue', label: 'Total Value', value: '$0', change: '+0%' },
      { key: 'turnoverRate', label: 'Turnover Rate', value: '0x', change: '+0x' }
    ];

    // Fetch real inventory data from products
    this.fetchInventoryData();
  }

  private clearReportData(): void {
    this.reportColumns = [];
    this.reportData = [];
    this.reportSummaryMetrics = [];
  }

  onFormatChange(format: string): void {
    this.selectedFormat = format;
  }

  onExportClick(format: string): void {
    if (!this.reportData.length) return;
    const title = this.getReportTitle(this.selectedReportType);
    const date  = new Date().toISOString().split('T')[0];
    const name  = `${this.selectedReportType}-report-${date}`;

    switch (format) {
      case 'csv':   this.exportCsv(name);   break;
      case 'excel': this.exportExcel(name, title); break;
      case 'pdf':   this.exportPdf(name, title);   break;
    }
  }

  private exportCsv(filename: string): void {
    const headers = this.reportColumns.map(c => `"${c.label}"`).join(',');
    const rows = this.reportData.map(row =>
      this.reportColumns.map(col => {
        const val = row[col.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = '\uFEFF' + [headers, ...rows].join('\r\n');
    this.triggerDownload(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `${filename}.csv`
    );
  }

  private exportExcel(filename: string, title: string): void {
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const headerCells = this.reportColumns
      .map(c => `<Cell><Data ss:Type="String">${esc(c.label)}</Data></Cell>`)
      .join('');
    const dataRows = this.reportData.map(row => {
      const cells = this.reportColumns.map(col => {
        const val = row[col.key] ?? '';
        const type = (col.type === 'number' || col.type === 'currency') && typeof val === 'number'
          ? 'Number' : 'String';
        return `<Cell><Data ss:Type="${type}">${esc(val)}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('');

    const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${esc(title)}">
    <Table>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
    this.triggerDownload(
      new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' }),
      `${filename}.xls`
    );
  }

  printReport(): void {
    if (!this.reportData.length) return;
    const title = this.getReportTitle(this.selectedReportType);
    const desc  = this.getReportDescription(this.selectedReportType);
    const html  = this.buildReportHtml(title, desc);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const iDoc = iframe.contentDocument!;
    iDoc.open();
    iDoc.write(html);
    iDoc.close();

    iframe.onload = () => {
      iframe.contentWindow!.onafterprint = () => iframe.remove();
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
    };
  }

  private exportPdf(filename: string, title: string): void {
    const desc    = this.getReportDescription(this.selectedReportType);
    const doc     = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const pw      = doc.internal.pageSize.getWidth();
    const ph      = doc.internal.pageSize.getHeight();
    const now     = new Date();
    const genDate = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const genTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Header band
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('WebShop', 10, 13);
    doc.setFontSize(12);
    doc.text(title, pw - 10, 13, { align: 'right' });

    // Subtitle
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(desc, 10, 27);
    doc.text(`Generated: ${genDate} at ${genTime}   |   ${this.reportData.length} records`, pw - 10, 27, { align: 'right' });
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.line(10, 30, pw - 10, 30);

    let y = 36;

    // Summary metric cards
    if (this.reportSummaryMetrics.length > 0) {
      const count = this.reportSummaryMetrics.length;
      const cardW = (pw - 20 - (count - 1) * 4) / count;
      const cardH = 22;
      this.reportSummaryMetrics.forEach((m, i) => {
        const x = 10 + i * (cardW + 4);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(m.label.toUpperCase(), x + 4, y + 7);
        doc.setTextColor(26, 32, 44);
        doc.setFontSize(15); doc.setFont('helvetica', 'bold');
        doc.text(String(m.value), x + 4, y + 17);
      });
      y += cardH + 8;
    }

    // Data table
    autoTable(doc, {
      head: [this.reportColumns.map(c => c.label.toUpperCase())],
      body: this.reportData.map(row =>
        this.reportColumns.map(col => String(row[col.key] ?? ''))
      ),
      startY: y,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [241, 245, 249],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [26, 32, 44],
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: (data: any) => {
        const pageNum = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`${title} — ${genDate}`, 10, ph - 5);
        doc.text(`Page ${pageNum}   |   WebShop Admin — Confidential`, pw - 10, ph - 5, { align: 'right' });
      },
    });

    doc.save(`${filename}.pdf`);
  }

  private buildReportHtml(title: string, description: string): string {
    const esc = (v: any) => String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const now       = new Date();
    const genDate   = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const genTime   = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const recordCount = this.reportData.length;

    const summaryRows = this.reportSummaryMetrics.map(m => `
      <div class="metric-card">
        <span class="metric-label">${esc(m.label)}</span>
        <span class="metric-value">${esc(m.value)}</span>
        ${m.change ? `<span class="metric-change ${m.change.startsWith('-') ? 'neg' : 'pos'}">${esc(m.change)}</span>` : ''}
      </div>`).join('');

    const headerCells = this.reportColumns
      .map(c => `<th>${esc(c.label)}</th>`).join('');
    const dataRows = this.reportData.map((row, i) => {
      const cells = this.reportColumns
        .map(col => `<td>${esc(row[col.key] ?? '')}</td>`).join('');
      return `<tr class="${i % 2 === 1 ? 'alt' : ''}">${cells}</tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a202c; background: #fff; }

  /* ── Page setup ── */
  @page {
    size: A4 landscape;
    margin: 12mm 15mm 16mm;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8px;
      color: #94a3b8;
    }
    @bottom-left {
      content: "Generated: ${genDate}";
      font-size: 8px;
      color: #94a3b8;
    }
    @top-right {
      content: "${esc(title)}";
      font-size: 8px;
      color: #94a3b8;
    }
  }

  /* ── Document wrapper ── */
  .doc { padding: 24px 28px; max-width: 1100px; margin: 0 auto; }
  @media print { .doc { padding: 0; } }

  /* ── Header ── */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 14px;
    border-bottom: 3px solid #1e293b;
    margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-icon {
    width: 44px; height: 44px; border-radius: 10px;
    background: #1e293b; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; line-height: 1;
  }
  .brand-name  { font-size: 18px; font-weight: 700; color: #1e293b; }
  .brand-sub   { font-size: 11px; color: #64748b; }
  .report-info { text-align: right; }
  .report-info h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
  .report-info .desc { font-size: 11px; color: #64748b; margin-bottom: 4px; }
  .report-info .meta { font-size: 10px; color: #94a3b8; }

  /* ── Summary metrics ── */
  .summary-section {
    margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .summary-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; }
  .metrics-grid { display: flex; gap: 10px; flex-wrap: wrap; }
  .metric-card {
    flex: 1; min-width: 120px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    background: #f8fafc;
  }
  .metric-label { display: block; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
  .metric-value { display: block; font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
  .metric-change { display: inline-block; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 10px; }
  .metric-change.pos { background: #dcfce7; color: #15803d; }
  .metric-change.neg { background: #fee2e2; color: #dc2626; }

  /* ── Table ── */
  .table-section { page-break-inside: auto; }
  .table-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; }
  .record-count { font-size: 10px; color: #94a3b8; float: right; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; }
  th {
    background: #1e293b;
    color: #f1f5f9;
    padding: 8px 10px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .4px;
    white-space: nowrap;
  }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  tr.alt td { background: #f8fafc; }
  tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }

  /* ── Print footer note ── */
  .print-footer {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
    font-size: 9px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
    page-break-inside: avoid;
  }
</style>
</head>
<body>
<div class="doc">
  <div class="doc-header">
    <div class="brand">
      <div class="brand-icon">&#x1F6D2;</div>
      <div>
        <div class="brand-name">WebShop</div>
        <div class="brand-sub">Admin &amp; Reports Portal</div>
      </div>
    </div>
    <div class="report-info">
      <h2>${esc(title)}</h2>
      <div class="desc">${esc(description)}</div>
      <div class="meta">Generated: ${genDate} at ${genTime} &nbsp;|&nbsp; ${recordCount} record${recordCount !== 1 ? 's' : ''}</div>
    </div>
  </div>

  ${summaryRows ? `
  <div class="summary-section">
    <div class="summary-title">Summary</div>
    <div class="metrics-grid">${summaryRows}</div>
  </div>` : ''}

  <div class="table-section">
    <div class="table-title">Report Data <span class="record-count">${recordCount} rows</span></div>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${dataRows}</tbody>
    </table>
  </div>

  <div class="print-footer">
    <span>${esc(title)} &mdash; ${genDate}</span>
    <span>WebShop Admin &mdash; Confidential</span>
  </div>
</div>

</body></html>`;
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearFilters(): void {
    this.currentFilters = [];
    this.currentSort = null;
    this.currentFilterValues = {};
    this.refreshReportData();
  }

  // Helper Methods
  getReportTitle(reportType: string): string {
    const titles: { [key: string]: string } = {
      orders: 'Orders Report',
      products: 'Products Report',
      customers: 'Customers Report',
      financial: 'Financial Report',
      inventory: 'Inventory Report'
    };
    return titles[reportType] || 'Report';
  }

  getReportDescription(reportType: string): string {
    const descriptions: { [key: string]: string } = {
      orders: 'Detailed order status and fulfillment metrics',
      products: 'Product performance and inventory analysis',
      customers: 'Customer demographics and behavior analysis',
      financial: 'Financial performance and profitability analysis',
      inventory: 'Inventory levels and stock analysis'
    };
    return descriptions[reportType] || 'Report analysis';
  }

  onRawValuesChanged(values: Record<string, any>): void {
    this.currentFilterValues = { ...values };
  }

  onClearAllFilters(): void {
    if (this.filterBar) {
      this.filterBar.onReset();
    } else {
      this.clearFilters();
    }
  }

  clearChip(chip: ActiveFilterChip): void {
    if (!this.filterBar) return;
    for (const key of chip.keys) {
      const dateRangeDef = this.filterDefinitions.find(
        d => d.controlType === 'dateRange' && (d.key + 'Start' === key || d.key + 'End' === key)
      );
      if (dateRangeDef) {
        this.filterBar.clearDateRange(dateRangeDef.key);
        break;
      } else {
        this.filterBar.clearFilter(key, true);
      }
    }
    this.currentFilterValues = { ...this.filterBar.form.value };
    this.filterBar.applyFilters();
  }

  onDynamicFilterChange(event: { filters: FilterViewModel[][], sort: DynamicSortOption }): void {
    this.currentFilters = event.filters;
    this.currentSort = event.sort;
    this.refreshReportData();
  }

  refreshReportData(): void {
    switch (this.selectedReportType) {
      case 'orders':    this.fetchOrdersData(); break;
      case 'products':  this.fetchProductsData(); break;
      case 'inventory': this.fetchInventoryData(); break;
      case 'customers': this.fetchCustomersData(); break;
      case 'financial': this.fetchFinancialData(); break;
    }
  }

  private fetchOrdersData(): void {
    this.loading = true;
    const sort = this.currentSort;
    const request: BaseDataViewModelRequest = {
      currentPage: 1,
      pageSize: 1000,
      column: sort?.column ?? 'OrderDate',
      accessor: sort?.column ?? 'OrderDate',
      ascending: sort?.ascending ?? false,
      descending: sort?.descending ?? true,
      filters: this.currentFilters
    };
    this.adminService.getOrdersWithFilters(request).subscribe({
      next: (response: BaseDataViewModelResponse<Order>) => {
        this.reportData = (response.data || []).map(order => ({
          id: order.id,
          buyerEmail: order.buyerEmail || 'N/A',
          status: order.status || 'Unknown',
          total: order.total || 0,
          orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          paymentType: order.paymentType || 'N/A',
          subtotal: order.subtotal || 0,
          shippingPrice: order.shippingPrice || 0
        }));

        // Update summary metrics
        this.updateOrdersSummaryMetrics(response.data || []);
        this.loading = false;
      },
      error: () => { this.reportData = []; this.loading = false; }
    });
  }

  private fetchProductsData(): void {
    this.loading = true;
    const sort = this.currentSort;
    const request: BaseDataViewModelRequest = {
      currentPage: 1,
      pageSize: 1000,
      column: sort?.column ?? '',
      accessor: sort?.column ?? '',
      ascending: sort?.ascending ?? true,
      descending: sort?.descending ?? false,
      filters: this.currentFilters
    };
    this.shopService.filterProducts(request).subscribe({
      next: (response: BaseDataViewModelResponse<Product>) => {
        this.reportData = (response.data || []).map(product => ({
          id: product.id,
          name: product.name || 'Unknown Product',
          type: product.type || 'Uncategorized',
          quantityInStock: product.quantityInStock || 0,
          price: product.price || 0,
          brand: product.brand || 'Unknown',
          totalValue: (product.quantityInStock || 0) * (product.price || 0)
        }));

        // Update summary metrics
        this.updateProductsSummaryMetrics(response.data || []);
        
        this.loading = false;
      },
      error: () => this.fetchProductsFallback()
    });
  }

  private fetchProductsFallback(): void {
    this.http.get(environment.baseUrl + 'products').subscribe({
      next: (response: any) => {
        let products: Product[] = [];
        if (Array.isArray(response)) {
          products = response;
        } else if (response?.data && Array.isArray(response.data)) {
          products = response.data;
        } else {
          this.reportData = [];
          this.loading = false;
          return;
        }
        this.reportData = products.map(product => ({
          id: product.id,
          name: product.name || 'Unknown Product',
          type: product.type || 'Uncategorized',
          quantityInStock: product.quantityInStock || 0,
          price: product.price || 0,
          brand: product.brand || 'Unknown',
          totalValue: (product.quantityInStock || 0) * (product.price || 0)
        }));

        // Update summary metrics
        this.updateProductsSummaryMetrics(products);
        
        this.loading = false;
      },
      error: () => { this.reportData = []; this.loading = false; }
    });
  }

  private updateOrdersSummaryMetrics(orders: Order[]): void {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'New' || o.status === 'Confirmed').length;
    const completedOrders = orders.filter(o => o.status === 'Delivered').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    if (this.selectedReportType === 'orders') {
      this.reportSummaryMetrics = [
        { key: 'totalOrders', label: 'Total Orders', value: totalOrders.toString(), change: '+8.3%' },
        { key: 'pendingOrders', label: 'Pending Orders', value: pendingOrders.toString(), change: `+${pendingOrders}` },
        { key: 'completedOrders', label: 'Completed Orders', value: completedOrders.toString(), change: '+6.3%' }
      ];
    } else if (this.selectedReportType === 'financial') {
      this.reportSummaryMetrics = [
        { key: 'totalRevenue', label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, change: '+12.5%' },
        { key: 'totalCosts', label: 'Total Costs', value: '$0.00', change: '+8.3%' },
        { key: 'netProfit', label: 'Net Profit', value: `$${totalRevenue.toFixed(2)}`, change: '+18.7%' }
      ];
    }
  }

  private updateProductsSummaryMetrics(products: Product[]): void {
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => (p.quantityInStock || 0) < 10).length;
    const totalValue = products.reduce((sum, p) => sum + ((p.quantityInStock || 0) * (p.price || 0)), 0);

    if (this.selectedReportType === 'products') {
      this.reportSummaryMetrics = [
        { key: 'totalProducts', label: 'Total Products', value: totalProducts.toString(), change: '+12' },
        { key: 'lowStock', label: 'Low Stock', value: lowStockItems.toString(), change: `-${lowStockItems}` },
        { key: 'totalValue', label: 'Total Value', value: `$${totalValue.toFixed(2)}`, change: '+15.2%' }
      ];
    } else if (this.selectedReportType === 'inventory') {
      const totalItems = products.reduce((sum, p) => sum + (p.quantityInStock || 0), 0);
      this.reportSummaryMetrics = [
        { key: 'totalItems', label: 'Total Items', value: totalItems.toString(), change: '+12' },
        { key: 'totalValue', label: 'Total Value', value: `$${totalValue.toFixed(2)}`, change: '+15.3%' },
        { key: 'lowStockItems', label: 'Low Stock Items', value: lowStockItems.toString(), change: '-3' }
      ];
    }
  }

  private fetchCustomersData(): void {
    this.loading = true;
    const sort = this.currentSort;
    const request: BaseDataViewModelRequest = {
      currentPage: 1,
      pageSize: 1000,
      column: sort?.column ?? 'OrderDate',
      accessor: sort?.column ?? 'OrderDate',
      ascending: sort?.ascending ?? false,
      descending: sort?.descending ?? true,
      filters: this.currentFilters
    };
    this.adminService.getOrdersWithFilters(request).subscribe({
      next: (response: BaseDataViewModelResponse<Order>) => {
        // Extract unique customers from orders
        const customerMap = new Map<string, any>();
        
        (response.data || []).forEach(order => {
          const email = order.buyerEmail;
          if (email && !customerMap.has(email)) {
            customerMap.set(email, {
              name: email.split('@')[0], // Extract name from email
              email: email,
              orders: 0,
              totalSpent: 0,
              joinedDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
          }
          if (email && customerMap.has(email)) {
            const customer = customerMap.get(email);
            customer.orders++;
            customer.totalSpent += order.total || 0;
          }
        });

        this.reportData = Array.from(customerMap.values()).map(customer => ({
          name: customer.name,
          email: customer.email,
          orders: customer.orders,
          totalSpent: customer.totalSpent,
          joinedDate: customer.joinedDate
        }));

        // Update summary metrics
        this.updateCustomersSummaryMetrics(Array.from(customerMap.values()));
        this.loading = false;
      },
      error: () => { this.reportData = []; this.loading = false; }
    });
  }

  private fetchFinancialData(): void {
    this.loading = true;
    const sort = this.currentSort;
    const request: BaseDataViewModelRequest = {
      currentPage: 1,
      pageSize: 1000,
      column: sort?.column ?? 'OrderDate',
      accessor: sort?.column ?? 'OrderDate',
      ascending: sort?.ascending ?? false,
      descending: sort?.descending ?? true,
      filters: this.currentFilters
    };
    this.adminService.getOrdersWithFilters(request).subscribe({
      next: (response: BaseDataViewModelResponse<Order>) => {
        this.reportData = (response.data || []).map(order => ({
          id: order.id,
          type: 'Income', // All orders are income
          paymentType: order.paymentType || 'Unknown',
          total: order.total || 0,
          orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        // Update summary metrics
        this.updateFinancialSummaryMetrics(response.data || []);
        this.loading = false;
      },
      error: () => { this.reportData = []; this.loading = false; }
    });
  }

  private fetchInventoryData(): void {
    this.loading = true;
    const sort = this.currentSort;
    const request: BaseDataViewModelRequest = {
      currentPage: 1,
      pageSize: 1000,
      column: sort?.column ?? '',
      accessor: sort?.column ?? '',
      ascending: sort?.ascending ?? true,
      descending: sort?.descending ?? false,
      filters: this.currentFilters
    };
    this.shopService.filterProducts(request).subscribe({
      next: (response: BaseDataViewModelResponse<Product>) => {
        this.reportData = (response.data || []).map(product => ({
          id: product.id,
          name: product.name || 'Unknown Product',
          quantityInStock: product.quantityInStock || 0,
          price: product.price || 0,
          brand: product.brand || 'Unknown',
          totalValue: (product.quantityInStock || 0) * (product.price || 0)
        }));

        // Update summary metrics
        this.updateInventorySummaryMetrics(response.data || []);
        this.loading = false;
      },
      error: () => this.fetchProductsFallback()
    });
  }

  private updateCustomersSummaryMetrics(customers: any[]): void {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.orders > 0).length;
    const newCustomers = customers.filter(c => {
      const joinedDate = new Date(c.joinedDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joinedDate > thirtyDaysAgo;
    }).length;

    this.reportSummaryMetrics = [
      { key: 'totalCustomers', label: 'Total Customers', value: totalCustomers.toString(), change: `+${totalCustomers}` },
      { key: 'activeCustomers', label: 'Active Customers', value: activeCustomers.toString(), change: `+${activeCustomers}` },
      { key: 'newCustomers', label: 'New Customers', value: newCustomers.toString(), change: `+${newCustomers}` }
    ];
  }

  private updateFinancialSummaryMetrics(orders: Order[]): void {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    this.reportSummaryMetrics = [
      { key: 'totalRevenue', label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, change: '+12.5%' },
      { key: 'totalCosts', label: 'Total Costs', value: '$0.00', change: '+8.3%' },
      { key: 'netProfit', label: 'Net Profit', value: `$${totalRevenue.toFixed(2)}`, change: '+18.7%' }
    ];
  }

  private updateInventorySummaryMetrics(products: Product[]): void {
    const totalItems = products.length;
    const totalValue = products.reduce((sum, p) => sum + ((p.quantityInStock || 0) * (p.price || 0)), 0);
    const lowStockItems = products.filter(p => (p.quantityInStock || 0) < 10).length;

    this.reportSummaryMetrics = [
      { key: 'totalItems', label: 'Total Items', value: totalItems.toString(), change: `+${totalItems}` },
      { key: 'totalValue', label: 'Total Value', value: `$${totalValue.toFixed(2)}`, change: '+15.3%' },
      { key: 'turnoverRate', label: 'Turnover Rate', value: '4.2x', change: '+0.3x' }
    ];
  }

}
