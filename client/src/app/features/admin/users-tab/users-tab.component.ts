import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

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
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    FormsModule
  ],
  templateUrl: './users-tab.component.html',
  styleUrl: './users-tab.component.scss'
})
export class UsersTabComponent implements OnInit {
  private adminService = inject(AdminService);

  users: UserInfo[] = [];
  filteredUsers: UserInfo[] = [];
  loading = true;
  searchTerm = '';

  displayedColumns = ['avatar', 'email', 'name', 'phone', 'roles', 'emailConfirmed', 'address'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }
    this.filteredUsers = this.users.filter(u =>
      (u.email?.toLowerCase().includes(term)) ||
      (u.firstName?.toLowerCase().includes(term)) ||
      (u.lastName?.toLowerCase().includes(term)) ||
      (u.phoneNumber?.includes(term)) ||
      (u.roles?.some(r => r.toLowerCase().includes(term)))
    );
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

  get totalUsers(): number {
    return this.users.length;
  }

  get adminCount(): number {
    return this.users.filter(u => u.roles?.includes('Admin')).length;
  }

  get customerCount(): number {
    return this.users.filter(u => u.roles?.includes('Customer')).length;
  }

  get confirmedCount(): number {
    return this.users.filter(u => u.emailConfirmed).length;
  }

  get unconfirmedCount(): number {
    return this.users.filter(u => !u.emailConfirmed).length;
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
