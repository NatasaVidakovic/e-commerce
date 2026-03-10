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
        path: 'admin',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [authGuard, adminGuard]
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
        path: 'admin/products/new',
        loadComponent: () => import('./features/admin/products-tab/product-add/product-add.component').then(m => m.AdminProductAddComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/products/:id/edit',
        loadComponent: () => import('./features/admin/admin-product-edit/admin-product-edit.component').then(m => m.AdminProductEditComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/products/:id',
        loadComponent: () => import('./features/admin/products-tab/product-details/product-details.component').then(m => m.AdminProductDetailsComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/discounts/new',
        loadComponent: () => import('./features/admin/discounts-tab/discount-form/discount-form.component').then(m => m.DiscountFormComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/discounts/:id/edit',
        loadComponent: () => import('./features/admin/discounts-tab/discount-form/discount-form.component').then(m => m.DiscountFormComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/discounts/:id',
        loadComponent: () => import('./features/admin/discounts-tab/discount-details/discount-details.component').then(m => m.DiscountDetailsComponent),
        canActivate: [authGuard, adminGuard]
    },
    { path: 'not-found', loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent) },
    { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
