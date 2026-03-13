import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { PaginationComponent, PaginationEvent } from '../../../shared/components/pagination/pagination.component';
import { DynamicFilterBarComponent } from '../../../shared/components/dynamic-filter-bar/dynamic-filter-bar.component';
import { DynamicFilterDefinition, DynamicSortOption, FilterViewModel } from '../../../shared/models/dynamic-filtering';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  roles: string[];
  address: {
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    country: string;
  } | null;
}

@Component({
  selector: 'app-users-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    PaginationComponent,
    DynamicFilterBarComponent
  ],
  templateUrl: './users-tab.component.html',
  styleUrl: './users-tab.component.scss'
})
export class UsersTabComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackbar = inject(SnackbarService);

  users: UserInfo[] = [];
  loading = true;
  private searchTerm = '';
  private selectedRole = '';
  private selectedVerified = '';
  private sortColumn = 'Email';
  private sortAscending = true;

  filterDefinitions: DynamicFilterDefinition[] = [
    {
      key: 'search',
      label: 'Search by email, name or phone',
      controlType: 'text',
      propertyName: 'Email',
      operationType: 'Contains',
      dataType: 'String'
    },
    {
      key: 'role',
      label: 'Role',
      controlType: 'select',
      propertyName: 'Role',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Admin', 'Customer'],
      multiple: false,
      allLabel: 'All Roles'
    },
    {
      key: 'emailConfirmed',
      label: 'Email Status',
      controlType: 'select',
      propertyName: 'EmailConfirmed',
      operationType: 'Equal',
      dataType: 'String',
      options: ['Verified', 'Unverified'],
      multiple: false,
      allLabel: 'All'
    }
  ];

  sortOptions: DynamicSortOption[] = [
    { label: 'Email (A-Z)', column: 'Email', ascending: true, descending: false },
    { label: 'Email (Z-A)', column: 'Email', ascending: false, descending: true }
  ];

  pageIndex = 0;
  pageSize = 10;
  totalCount = 0;
  readonly pageSizeOptions = [10, 25, 50];

  displayedColumns = ['email', 'name', 'phone', 'roles', 'emailConfirmed', 'address'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers(this.pageIndex + 1, this.pageSize, this.searchTerm, this.selectedRole, this.selectedVerified, this.sortColumn, this.sortAscending).subscribe({
      next: (result) => {
        this.users = result.data;
        this.totalCount = result.count;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.snackbar.errorFrom(err, 'Failed to load users');
        this.loading = false;
      }
    });
  }

  onFiltersChanged(event: { filters: FilterViewModel[][], sort: DynamicSortOption }): void {
    const allFilters = event.filters.flat();

    const searchFilter = allFilters.find(f => f.propertyName === 'Email' && f.operationType === 'Contains');
    this.searchTerm = searchFilter?.value ?? '';

    const roleFilter = allFilters.find(f => f.propertyName === 'Role');
    this.selectedRole = roleFilter?.value ?? '';

    const confirmedFilter = allFilters.find(f => f.propertyName === 'EmailConfirmed');
    const confirmedRaw: string = confirmedFilter?.value ?? '';
    this.selectedVerified = confirmedRaw === 'Verified' ? 'true' : confirmedRaw === 'Unverified' ? 'false' : '';

    const sort = event.sort;
    if (sort) {
      this.sortColumn = sort.column;
      this.sortAscending = sort.ascending;
    }

    this.pageIndex = 0;
    this.loadUsers();
  }

  onFiltersReset(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedVerified = '';
    this.sortColumn = 'Email';
    this.sortAscending = true;
    this.pageIndex = 0;
    this.loadUsers();
  }

  onPageChange(event: PaginationEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  getUserName(user: UserInfo): string {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  }

  getAddressString(user: UserInfo): string {
    if (!user.address) return '—';
    const parts = [user.address.line1, user.address.line2, user.address.city, user.address.postalCode, user.address.country].filter(Boolean);
    return parts.join(', ');
  }

  getInitials(user: UserInfo): string {
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.lastName) return user.lastName[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() ?? '?';
  }

  getAvatarColor(user: UserInfo): string {
    const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4'];
    const index = (user.email?.charCodeAt(0) ?? 0) % colors.length;
    return colors[index];
  }
}
