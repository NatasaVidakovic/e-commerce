import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportFilter {
  dateRange: string;
  startDate?: Date;
  endDate?: Date;
  orderStatus?: string;
  paymentMethod?: string;
  category?: string;
  customer?: string;
}

export interface ReportRequest {
  type: string;
  format: string;
  filters: ReportFilter;
}

export interface ReportResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  generatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  downloadInvoice(orderId: number): void {
    this.downloadPdf(`${this.baseUrl}reports/invoice/${orderId}`, `invoice-order-${orderId}.pdf`);
  }

  downloadOrderSummary(orderId: number): void {
    this.downloadPdf(`${this.baseUrl}reports/order/${orderId}`, `order-summary-${orderId}.pdf`);
  }

  downloadProductSheet(productId: number): void {
    this.downloadPdf(`${this.baseUrl}reports/product/${productId}`, `product-sheet-${productId}.pdf`);
  }

  getDesignerUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.baseUrl}reports/designer-url`);
  }

  private downloadPdf(url: string, fallbackFilename: string): void {
    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) return;

        const contentDisposition = response.headers.get('content-disposition');
        let filename = fallbackFilename;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match?.[1]) {
            filename = match[1].replace(/['"]/g, '');
          }
        }

        this.triggerDownload(blob, filename);
      },
      error: (err) => {
        console.error('PDF download failed:', err);
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateOrdersReport(request: ReportRequest): Observable<ReportResponse> {
    const mockResponse: ReportResponse = {
      downloadUrl: `${this.baseUrl}api/admin/reports/orders/download`,
      fileName: `orders-report.${request.format}`,
      fileSize: 1024000,
      generatedAt: new Date()
    };
    return of(mockResponse);
  }

  generateRevenueSummaryReport(request: ReportRequest): Observable<ReportResponse> {
    const mockResponse: ReportResponse = {
      downloadUrl: `${this.baseUrl}api/admin/reports/revenue-summary/download`,
      fileName: `revenue-summary.${request.format}`,
      fileSize: 512000,
      generatedAt: new Date()
    };
    return of(mockResponse);
  }

  generateDailySalesReport(request: ReportRequest): Observable<ReportResponse> {
    const mockResponse: ReportResponse = {
      downloadUrl: `${this.baseUrl}api/admin/reports/daily-sales/download`,
      fileName: `daily-sales.${request.format}`,
      fileSize: 768000,
      generatedAt: new Date()
    };
    return of(mockResponse);
  }

  generateProductSalesReport(request: ReportRequest): Observable<ReportResponse> {
    const mockResponse: ReportResponse = {
      downloadUrl: `${this.baseUrl}api/admin/reports/product-sales/download`,
      fileName: `product-sales.${request.format}`,
      fileSize: 896000,
      generatedAt: new Date()
    };
    return of(mockResponse);
  }

  generateCustomerReport(request: ReportRequest): Observable<ReportResponse> {
    const mockResponse: ReportResponse = {
      downloadUrl: `${this.baseUrl}api/admin/reports/customers/download`,
      fileName: `customer-report.${request.format}`,
      fileSize: 640000,
      generatedAt: new Date()
    };
    return of(mockResponse);
  }

  generateInventoryReport(request: ReportRequest): Observable<ReportResponse> {
    const mockResponse: ReportResponse = {
      downloadUrl: `${this.baseUrl}api/admin/reports/inventory/download`,
      fileName: `inventory-report.${request.format}`,
      fileSize: 448000,
      generatedAt: new Date()
    };
    return of(mockResponse);
  }

  downloadReport(downloadUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getReportFormats(reportType: string): string[] {
    const formats: Record<string, string[]> = {
      'orders': ['pdf', 'excel', 'csv'],
      'revenue-summary': ['pdf', 'excel'],
      'daily-sales': ['pdf', 'excel', 'csv'],
      'product-sales': ['pdf', 'excel'],
      'customers': ['pdf', 'excel'],
      'inventory': ['pdf', 'excel']
    };
    return formats[reportType] || ['pdf'];
  }

  validateFilters(reportType: string, filters: ReportFilter): boolean {
    if (!filters.dateRange) {
      return false;
    }
    if (filters.dateRange === 'custom') {
      if (!filters.startDate || !filters.endDate) {
        return false;
      }
      if (filters.startDate > filters.endDate) {
        return false;
      }
    }
    return true;
  }
}
