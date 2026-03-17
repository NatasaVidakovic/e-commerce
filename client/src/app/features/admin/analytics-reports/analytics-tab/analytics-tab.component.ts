import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import { AdminService } from '../../../../core/services/admin.service';
import { ShopService } from '../../../../core/services/shop.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { DynamicFilterBarComponent } from '../../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { BaseDataViewModelRequest } from '../../../../shared/models/dynamic-filtering';
import { DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../../shared/models/dynamic-filtering';
import { Order } from '../../../../shared/models/order';
import { Product } from '../../../../shared/models/product';

export interface KpiCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-analytics-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    DynamicFilterBarComponent
  ],
  templateUrl: './analytics-tab.component.html',
  styleUrl: './analytics-tab.component.scss'
})
export class AnalyticsTabComponent implements OnInit {
  private adminService = inject(AdminService);
  private shopService = inject(ShopService);
  private currencyService = inject(CurrencyService);

  selectedStatistic: string | null = null;
  loading = false;
  Math = Math;

  // Raw data (full load, filtered client-side for analytics)
  private allOrders: Order[] = [];
  private allProducts: Product[] = [];

  // Filtered/active data for computing analytics
  orders: Order[] = [];
  products: Product[] = [];

  // Date range filter state
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Dynamic filter definitions for analytics
  filterDefinitions: DynamicFilterDefinition[] = [
    {
      key: 'orderDate',
      label: 'Date Range',
      controlType: 'dateRange',
      propertyName: 'orderDate',
      operationType: 'Equal',
      dataType: 'DateTime'
    }
  ];
  sortOptions: DynamicSortOption[] = [];

  // KPI cards
  kpiCards: KpiCard[] = [];

  // Chart data
  revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `Revenue: ${this.currencyService.formatCurrency(value || 0)}`;
          }
        }
      }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: { 
          callback: (v: number | string) => this.currencyService.formatCurrency(Number(v)) 
        },
        title: {
          display: true,
          text: 'Revenue'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    }
  };

  orderStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  orderStatusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      } 
    }
  };

  productStockChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  productStockChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            return `Stock: ${Math.round(value || 0)} units`;
          }
        }
      }
    },
    scales: { 
      x: { 
        beginAtZero: true,
        ticks: {
          callback: (v: number | string) => Math.round(Number(v)).toString()
        },
        title: {
          display: true,
          text: 'Stock Quantity'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Products'
        }
      }
    }
  };

  categoryChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  categoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      } 
    }
  };

  customerOrderChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  customerOrderChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `Orders: ${Math.round(value || 0)}`;
          }
        }
      }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (v: number | string) => Math.round(Number(v)).toString()
        },
        title: {
          display: true,
          text: 'Number of Orders'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Customers'
        }
      }
    }
  };

  revenueByPaymentChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  revenueByPaymentChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      } 
    }
  };

  userStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  userStatusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      } 
    }
  };

  ngOnInit(): void {
    this.loadAllData();
  }

  selectStatistic(type: string): void {
    this.selectedStatistic = type;
    this.updateCharts();
  }

  onFilterChange(event: { filters: FilterViewModel[][], sort: DynamicSortOption }): void {
    // Extract date range from filters
    this.startDate = null;
    this.endDate = null;
    for (const group of event.filters) {
      for (const f of group) {
        if (f.operationType === 'GreaterThanOrEqual' && f.value) {
          this.startDate = new Date(f.value);
        }
        if (f.operationType === 'LessThanOrEqual' && f.value) {
          this.endDate = new Date(f.value);
        }
      }
    }
    this.applyDateFilter();
    this.updateCharts();
  }

  onFilterReset(): void {
    this.startDate = null;
    this.endDate = null;
    this.orders = [...this.allOrders];
    this.updateCharts();
  }

  private applyDateFilter(): void {
    this.orders = this.allOrders.filter(order => {
      const date = new Date(order.orderDate);
      if (this.startDate && date < this.startDate) return false;
      if (this.endDate && date > this.endDate) return false;
      return true;
    });
  }

  private loadAllData(): void {
    this.loading = true;
    const ordersReq: BaseDataViewModelRequest = { currentPage: 1, pageSize: 2000, column: '', accessor: '', ascending: false, descending: true, filters: [] };
    const productsReq: BaseDataViewModelRequest = { currentPage: 1, pageSize: 2000, column: '', accessor: '', ascending: true, descending: false, filters: [] };

    forkJoin({
      orders: this.adminService.getOrdersWithFilters(ordersReq).pipe(catchError(() => of(null))),
      products: this.shopService.filterProducts(productsReq).pipe(catchError(() => of(null)))
    }).subscribe(({ orders, products }) => {
      this.allOrders = orders?.data || [];
      this.orders = [...this.allOrders];
      this.allProducts = products?.data || [];
      this.products = [...this.allProducts];
      this.loading = false;
      this.updateCharts();
    });
  }

  private updateCharts(): void {
    if (!this.selectedStatistic) return;
    this.buildKpiCards();
    this.buildRevenueChart();
    this.buildOrderStatusChart();
    this.buildProductStockChart();
    this.buildCategoryChart();
    this.buildCustomerOrderChart();
    this.buildRevenueByPaymentChart();
    this.buildUserStatusChart();
  }

  private buildKpiCards(): void {
    const orders = this.orders;
    const products = this.allProducts;
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const avgOrder = orders.length ? totalRevenue / orders.length : 0;
    const pending = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
    const delivered = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
    const cancelled = orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
    const lowStock = products.filter(p => (p.quantityInStock || 0) < 10 && (p.quantityInStock || 0) > 0).length;
    const outStock = products.filter(p => (p.quantityInStock || 0) === 0).length;
    const uniqueCustomers = new Set(orders.map(o => o.buyerEmail)).size;

    const cards: Record<string, KpiCard[]> = {
      revenue: [
        { title: 'Total Revenue', value: this.currencyService.formatCurrency(totalRevenue), icon: 'payments', accent: '#10b981' },
        { title: 'Avg Order Value', value: this.currencyService.formatCurrency(avgOrder), icon: 'trending_up', accent: '#3b82f6' },
        { title: 'Total Orders', value: orders.length, icon: 'receipt_long', accent: '#8b5cf6' },
        { title: 'Unique Customers', value: uniqueCustomers, icon: 'people', accent: '#f59e0b' }
      ],
      orders: [
        { title: 'Total Orders', value: orders.length, icon: 'shopping_cart', accent: '#3b82f6' },
        { title: 'Pending', value: pending, icon: 'schedule', accent: '#f59e0b' },
        { title: 'Delivered', value: delivered, icon: 'local_shipping', accent: '#10b981' },
        { title: 'Cancelled', value: cancelled, icon: 'cancel', accent: '#ef4444' }
      ],
      products: [
        { title: 'Total Products', value: products.length, icon: 'inventory_2', accent: '#3b82f6' },
        { title: 'Low Stock', value: lowStock, subtitle: '< 10 units', icon: 'warning', accent: '#f59e0b' },
        { title: 'Out of Stock', value: outStock, icon: 'remove_shopping_cart', accent: '#ef4444' },
        { title: 'In Stock', value: products.length - outStock, icon: 'check_circle', accent: '#10b981' }
      ],
      customers: [
        { title: 'Total Customers', value: uniqueCustomers, icon: 'people', accent: '#3b82f6' },
        { title: 'Orders Placed', value: orders.length, icon: 'receipt_long', accent: '#10b981' },
        { title: 'Avg Orders/Customer', value: uniqueCustomers ? (orders.length / uniqueCustomers).toFixed(1) : '0', icon: 'repeat', accent: '#8b5cf6' },
        { title: 'Total Spent', value: this.currencyService.formatCurrency(totalRevenue), icon: 'payments', accent: '#f59e0b' }
      ]
    };
    this.kpiCards = cards[this.selectedStatistic!] || [];
  }

  private buildRevenueChart(): void {
    const monthMap = new Map<string, number>();
    this.orders.forEach(order => {
      const d = new Date(order.orderDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + (order.total || 0));
    });
    
    // Show last 18 months instead of 12 for more detail
    const sorted = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-18);
    
    // Format month labels for better readability
    const labels = sorted.map(([key]) => {
      const [year, month] = key.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
    });
    
    // Round revenue values to 2 decimal places
    const data = sorted.map(([, value]) => Math.round(value * 100) / 100);
    
    this.revenueChartData = {
      labels: labels,
      datasets: [{ 
        data: data, 
        backgroundColor: '#3b82f6', 
        borderRadius: 4, 
        label: 'Revenue',
        borderWidth: 1,
        borderColor: '#2563eb'
      }]
    };
  }

  private buildOrderStatusChart(): void {
    // Define all possible order statuses
    const allStatuses = [
      'New', 'Confirmed', 'Preparing', 'ReadyToShip', 'Shipped', 
      'OutForDelivery', 'Delivered', 'Returned', 'Cancelled', 
      'OnHold', 'FraudReview', 'PaymentFailed', 'PaymentMismatch'
    ];
    
    // Initialize map with all statuses set to 0
    const statusMap = new Map<string, number>();
    allStatuses.forEach(status => statusMap.set(status, 0));
    
    // Count actual orders
    this.orders.forEach(o => {
      const s = o.status || 'Unknown';
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    
    const entries = Array.from(statusMap.entries());
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16', '#14b8a6', '#a855f7', '#ec4899', '#f97316', '#6366f1'];
    this.orderStatusChartData = {
      labels: entries.map(([k]) => k),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: palette.slice(0, entries.length) }]
    };
  }

  private buildProductStockChart(): void {
    // Show top 15 products instead of 10 for more detail
    const topProducts = [...this.allProducts]
      .sort((a, b) => (b.quantityInStock || 0) - (a.quantityInStock || 0))
      .slice(0, 15);
    
    // Format product names for better readability
    const labels = topProducts.map(p => {
      const name = p.name || 'Unknown';
      // Truncate long product names
      return name.length > 20 ? name.substring(0, 17) + '...' : name;
    });
    
    // Round the stock quantities to whole numbers
    const data = topProducts.map(p => Math.round(p.quantityInStock || 0));
    
    this.productStockChartData = {
      labels: labels,
      datasets: [{ 
        data: data, 
        backgroundColor: '#10b981', 
        label: 'Stock',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#059669'
      }]
    };
  }

  private buildCategoryChart(): void {
    const catMap = new Map<string, number>();
    this.allProducts.forEach(p => {
      const cat = p.productType?.name || p.type || 'Other';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    const entries = Array.from(catMap.entries());
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];
    this.categoryChartData = {
      labels: entries.map(([k]) => k),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: palette.slice(0, entries.length) }]
    };
  }

  private buildCustomerOrderChart(): void {
    const custMap = new Map<string, number>();
    this.orders.forEach(o => {
      if (o.buyerEmail) custMap.set(o.buyerEmail, (custMap.get(o.buyerEmail) || 0) + 1);
    });
    
    // Show top 15 customers instead of 10 for more detail
    const topCustomers = Array.from(custMap.entries()).sort(([, a], [, b]) => b - a).slice(0, 15);
    
    // Format labels to show first part of email for better readability
    const labels = topCustomers.map(([email]) => {
      const emailParts = email.split('@');
      const username = emailParts[0];
      // Truncate long usernames
      return username.length > 15 ? username.substring(0, 12) + '...' : username;
    });
    
    // Round the order counts to whole numbers
    const data = topCustomers.map(([, count]) => Math.round(count));
    
    this.customerOrderChartData = {
      labels: labels,
      datasets: [{ 
        data: data, 
        backgroundColor: '#8b5cf6', 
        label: 'Orders',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#7c3aed'
      }]
    };
  }

  private buildRevenueByPaymentChart(): void {
    const pmMap = new Map<string, number>();
    this.orders.forEach(o => {
      const pm = o.paymentType || 'Unknown';
      pmMap.set(pm, (pmMap.get(pm) || 0) + (o.total || 0));
    });
    const entries = Array.from(pmMap.entries());
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    this.revenueByPaymentChartData = {
      labels: entries.map(([k]) => k),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: palette.slice(0, entries.length) }]
    };
  }

  private buildUserStatusChart(): void {
    // Get unique customers from orders
    const uniqueEmails = new Set(this.orders.map(o => o.buyerEmail).filter(e => e));
    const totalCustomers = uniqueEmails.size;
    
    // For demo purposes, we'll categorize customers based on order behavior
    // Active: customers with 3+ orders
    // Regular: customers with 2 orders
    // New: customers with 1 order
    const customerOrderCount = new Map<string, number>();
    this.orders.forEach(o => {
      if (o.buyerEmail) {
        customerOrderCount.set(o.buyerEmail, (customerOrderCount.get(o.buyerEmail) || 0) + 1);
      }
    });
    
    let activeCustomers = 0;
    let regularCustomers = 0;
    let newCustomers = 0;
    
    customerOrderCount.forEach((count) => {
      if (count >= 3) activeCustomers++;
      else if (count === 2) regularCustomers++;
      else newCustomers++;
    });
    
    const statusData = [
      { label: 'Active Customers (3+ orders)', count: activeCustomers },
      { label: 'Regular Customers (2 orders)', count: regularCustomers },
      { label: 'New Customers (1 order)', count: newCustomers }
    ];
    
    const palette = ['#10b981', '#3b82f6', '#f59e0b'];
    this.userStatusChartData = {
      labels: statusData.map(s => s.label),
      datasets: [{ data: statusData.map(s => s.count), backgroundColor: palette }]
    };
  }
}
