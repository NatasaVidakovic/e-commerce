import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { notAdminGuard } from './core/guards/not-admin.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'about',
        loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
    },
    {
        path: 'shop',
        loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent)
    },
    {
        path: 'shop/:id',
        loadComponent: () => import('./features/shop/product-details/product-details.component').then(m => m.ProductDetailsComponent)
    },
    {
        path: 'favourites',
        loadComponent: () => import('./features/shop/favourites/favourites.component').then(m => m.FavouritesComponent),
        canActivate: [authGuard, notAdminGuard]
    },
    {
        path: 'orders',
        loadChildren: () => import('./features/orders/routes').then(mod => mod.orderRoutes),
        canActivate: [authGuard, notAdminGuard]
    },
    {
        path: 'checkout',
        loadChildren: () => import('./features/checkout/routes').then(mod => mod.checkoutRoutes),
        canActivate: [notAdminGuard]
    },
    {
        path: 'account',
        loadChildren: () => import('./features/account/routes').then(mod => mod.accountRoutes)
    },
    {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
        canActivate: [notAdminGuard]
    },
    {
        path: 'test-error',
        loadComponent: () => import('./features/test-error/test-error.component').then(m => m.TestErrorComponent)
    },
    {
        path: 'server-error',
        loadComponent: () => import('./shared/components/server-error/server-error.component').then(m => m.ServerErrorComponent)
    },
    {
        path: 'admin/statistics',
        loadComponent: () => import('./features/admin/analytics-reports/analytics-tab/analytics-tab.component').then(m => m.AnalyticsTabComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/reports',
        loadComponent: () => import('./features/admin/analytics-reports/reports-tab/reports-tab.component').then(m => m.ReportsTabComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        canActivate: [authGuard, adminGuard],
        children: [
            { path: '', redirectTo: 'orders', pathMatch: 'full' },
            {
                path: 'orders',
                loadComponent: () => import('./features/admin/order-management/order-management.component').then(m => m.OrderManagementComponent)
            },
            {
                path: 'catalog',
                loadComponent: () => import('./features/admin/catalog/catalog.component').then(m => m.CatalogComponent)
            },
            {
                path: 'catalog/new',
                loadComponent: () => import('./features/admin/products-tab/product-add/product-add.component').then(m => m.AdminProductAddComponent)
            },
            {
                path: 'catalog/:id/edit',
                loadComponent: () => import('./features/admin/admin-product-edit/admin-product-edit.component').then(m => m.AdminProductEditComponent)
            },
            {
                path: 'catalog/:id',
                loadComponent: () => import('./features/admin/products-tab/product-details/product-details.component').then(m => m.AdminProductDetailsComponent)
            },
            {
                path: 'product-types',
                loadComponent: () => import('./features/admin/product-type-management/product-type-management.component').then(m => m.ProductTypeManagementComponent)
            },
            {
                path: 'best-reviewed',
                loadComponent: () => import('./features/admin/best-reviewed-products/best-reviewed-products.component').then(m => m.BestReviewedComponent)
            },
            {
                path: 'best-selling',
                loadComponent: () => import('./features/admin/best-selling-products/best-selling-products.component').then(m => m.BestSellingProductsComponent)
            },
            {
                path: 'suggested',
                loadComponent: () => import('./features/admin/suggested-products/suggested-products.component').then(m => m.SuggestedProductsComponent)
            },
            {
                path: 'discounts',
                loadComponent: () => import('./features/admin/discounts-tab/discounts-tab.component').then(m => m.DiscountsTabComponent)
            },
            {
                path: 'discounts/new',
                loadComponent: () => import('./features/admin/discounts-tab/discount-form/discount-form.component').then(m => m.DiscountFormComponent)
            },
            {
                path: 'discounts/:id/edit',
                loadComponent: () => import('./features/admin/discounts-tab/discount-form/discount-form.component').then(m => m.DiscountFormComponent)
            },
            {
                path: 'discounts/:id',
                loadComponent: () => import('./features/admin/discounts-tab/discount-details/discount-details.component').then(m => m.DiscountDetailsComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./features/admin/users-tab/users-tab.component').then(m => m.UsersTabComponent)
            },
            {
                path: 'theme-settings',
                loadComponent: () => import('./features/admin/theme-settings/theme-settings.component').then(m => m.ThemeSettingsComponent)
            },
            {
                path: 'site-settings',
                loadComponent: () => import('./features/admin/site-settings/site-settings.component').then(m => m.SiteSettingsComponent)
            },
            {
                path: 'shop-location',
                loadComponent: () => import('./features/admin/shop-location/shop-location.component').then(m => m.ShopLocationComponent)
            },
            // Legacy product routes - redirect to catalog
            {
                path: 'products/new',
                loadComponent: () => import('./features/admin/products-tab/product-add/product-add.component').then(m => m.AdminProductAddComponent)
            },
            {
                path: 'products/:id/edit',
                loadComponent: () => import('./features/admin/admin-product-edit/admin-product-edit.component').then(m => m.AdminProductEditComponent)
            },
            {
                path: 'products/:id',
                loadComponent: () => import('./features/admin/products-tab/product-details/product-details.component').then(m => m.AdminProductDetailsComponent)
            },
        ]
    },
    { path: 'not-found', loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent) },
    { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
