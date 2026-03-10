import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyticsKpi {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: string;
  color: string;
}

export interface SalesAnalytics {
  revenueTrend: Array<{ date: string; revenue: number }>;
  ordersTrend: Array<{ date: string; orders: number }>;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  revenueByPaymentMethod: Array<{ method: string; revenue: number }>;
  revenueGrowth: number;
}

export interface ProductAnalytics {
  bestSelling: Array<{ name: string; quantity: number; revenue: number }>;
  highestRevenue: Array<{ name: string; revenue: number }>;
  highestReturnRate: Array<{ name: string; returnRate: number }>;
  mostViewed: Array<{ name: string; views: number }>;
  noSales: Array<{ name: string; lastSold?: string }>;
}

export interface CustomerAnalytics {
  newCustomersTrend: Array<{ date: string; customers: number }>;
  returningCustomersPercentage: number;
  topCustomers: Array<{ name: string; revenue: number }>;
  revenueByCity: Array<{ city: string; revenue: number }>;
}

export interface InventoryAnalytics {
  lowStock: Array<{ name: string; stock: number; minStock: number }>;
  outOfStock: Array<{ name: string }>;
  inventoryValue: number;
  slowMoving: Array<{ name: string; daysSinceLastSale: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  getKpiData(dateRange: string): Observable<AnalyticsKpi[]> {
    // Mock data - will be replaced with actual API call
    const mockData: AnalyticsKpi[] = [
      {
        title: 'Total Revenue',
        value: '$124,563',
        change: 12.5,
        changeType: 'increase',
        icon: 'attach_money',
        color: 'primary'
      },
      {
        title: 'Total Orders',
        value: '1,234',
        change: 8.3,
        changeType: 'increase',
        icon: 'shopping_cart',
        color: 'accent'
      },
      {
        title: 'Average Order Value',
        value: '$101.00',
        change: -2.1,
        changeType: 'decrease',
        icon: 'receipt',
        color: 'warn'
      },
      {
        title: 'Conversion Rate',
        value: '3.2%',
        change: 0.5,
        changeType: 'increase',
        icon: 'trending_up',
        color: 'primary'
      },
      {
        title: 'New Customers',
        value: '456',
        change: 15.7,
        changeType: 'increase',
        icon: 'person_add',
        color: 'accent'
      },
      {
        title: 'Total Customers',
        value: '8,901',
        change: 5.2,
        changeType: 'increase',
        icon: 'people',
        color: 'primary'
      },
      {
        title: 'Cancelled Orders',
        value: '23',
        change: -8.0,
        changeType: 'decrease',
        icon: 'cancel',
        color: 'warn'
      },
      {
        title: 'Low Stock Products',
        value: '12',
        change: 3,
        changeType: 'increase',
        icon: 'warning',
        color: 'warn'
      }
    ];

    return of(mockData);
  }

  getSalesAnalytics(dateRange: string): Observable<SalesAnalytics> {
    // Mock data - will be replaced with actual API call
    const mockData: SalesAnalytics = {
      revenueTrend: [
        { date: '2024-01-01', revenue: 1200 },
        { date: '2024-01-02', revenue: 1500 },
        { date: '2024-01-03', revenue: 1100 },
        { date: '2024-01-04', revenue: 1800 },
        { date: '2024-01-05', revenue: 1600 }
      ],
      ordersTrend: [
        { date: '2024-01-01', orders: 12 },
        { date: '2024-01-02', orders: 15 },
        { date: '2024-01-03', orders: 11 },
        { date: '2024-01-04', orders: 18 },
        { date: '2024-01-05', orders: 16 }
      ],
      revenueByCategory: [
        { category: 'Electronics', revenue: 45000 },
        { category: 'Clothing', revenue: 32000 },
        { category: 'Books', revenue: 18000 },
        { category: 'Home & Garden', revenue: 29000 }
      ],
      revenueByPaymentMethod: [
        { method: 'Credit Card', revenue: 68000 },
        { method: 'PayPal', revenue: 35000 },
        { method: 'Bank Transfer', revenue: 15000 },
        { method: 'Cash on Delivery', revenue: 6500 }
      ],
      revenueGrowth: 12.5
    };

    return of(mockData);
  }

  getProductAnalytics(dateRange: string): Observable<ProductAnalytics> {
    // Mock data - will be replaced with actual API call
    const mockData: ProductAnalytics = {
      bestSelling: [
        { name: 'Laptop Pro', quantity: 45, revenue: 45000 },
        { name: 'Wireless Mouse', quantity: 120, revenue: 3600 },
        { name: 'USB-C Hub', quantity: 89, revenue: 2670 }
      ],
      highestRevenue: [
        { name: 'Laptop Pro', revenue: 45000 },
        { name: 'Gaming Chair', revenue: 12000 },
        { name: 'Monitor 4K', revenue: 8900 }
      ],
      highestReturnRate: [
        { name: 'Cheap Headphones', returnRate: 15.2 },
        { name: 'Phone Case', returnRate: 8.7 },
        { name: 'Cable Set', returnRate: 5.3 }
      ],
      mostViewed: [
        { name: 'Laptop Pro', views: 1250 },
        { name: 'Gaming Chair', views: 890 },
        { name: 'Monitor 4K', views: 756 }
      ],
      noSales: [
        { name: 'Old Keyboard', lastSold: '2023-12-15' },
        { name: 'Vintage Mouse', lastSold: '2023-11-20' }
      ]
    };

    return of(mockData);
  }

  getCustomerAnalytics(dateRange: string): Observable<CustomerAnalytics> {
    // Mock data - will be replaced with actual API call
    const mockData: CustomerAnalytics = {
      newCustomersTrend: [
        { date: '2024-01-01', customers: 12 },
        { date: '2024-01-02', customers: 18 },
        { date: '2024-01-03', customers: 15 },
        { date: '2024-01-04', customers: 22 },
        { date: '2024-01-05', customers: 19 }
      ],
      returningCustomersPercentage: 68.5,
      topCustomers: [
        { name: 'John Doe', revenue: 2500 },
        { name: 'Jane Smith', revenue: 1800 },
        { name: 'Bob Johnson', revenue: 1200 }
      ],
      revenueByCity: [
        { city: 'New York', revenue: 45000 },
        { city: 'Los Angeles', revenue: 32000 },
        { city: 'Chicago', revenue: 28000 }
      ]
    };

    return of(mockData);
  }

  getInventoryAnalytics(): Observable<InventoryAnalytics> {
    // Mock data - will be replaced with actual API call
    const mockData: InventoryAnalytics = {
      lowStock: [
        { name: 'Laptop Pro', stock: 3, minStock: 5 },
        { name: 'Wireless Mouse', stock: 7, minStock: 10 },
        { name: 'USB-C Hub', stock: 2, minStock: 8 }
      ],
      outOfStock: [
        { name: 'Gaming Headset' },
        { name: 'Webcam HD' }
      ],
      inventoryValue: 125000,
      slowMoving: [
        { name: 'Old Keyboard', daysSinceLastSale: 120 },
        { name: 'Vintage Mouse', daysSinceLastSale: 90 }
      ]
    };

    return of(mockData);
  }
}
