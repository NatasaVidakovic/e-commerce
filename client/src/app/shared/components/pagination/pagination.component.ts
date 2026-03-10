import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslatePipe } from '@ngx-translate/core';

export interface PaginationEvent {
  pageIndex: number;
  pageSize: number;
  previousPageIndex?: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslatePipe
  ],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() length: number = 0;
  @Input() pageSize: number = 25;
  @Input() pageIndex: number = 0;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() showFirstLastButtons: boolean = true;
  @Input() disabled: boolean = false;
  
  @Output() page = new EventEmitter<PaginationEvent>();

  get totalPages(): number {
    return Math.ceil(this.length / this.pageSize);
  }

  get currentPage(): number {
    return this.pageIndex + 1;
  }

  get startItem(): number {
    return this.length === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get endItem(): number {
    const end = (this.pageIndex + 1) * this.pageSize;
    return Math.min(end, this.length);
  }

  get hasPreviousPage(): boolean {
    return this.pageIndex > 0;
  }

  get hasNextPage(): boolean {
    return this.pageIndex < this.totalPages - 1;
  }

  firstPage(): void {
    if (!this.hasPreviousPage || this.disabled) return;
    this.changePage(0);
  }

  previousPage(): void {
    if (!this.hasPreviousPage || this.disabled) return;
    this.changePage(this.pageIndex - 1);
  }

  nextPage(): void {
    if (!this.hasNextPage || this.disabled) return;
    this.changePage(this.pageIndex + 1);
  }

  lastPage(): void {
    if (!this.hasNextPage || this.disabled) return;
    this.changePage(this.totalPages - 1);
  }

  changePageSize(newSize: number): void {
    if (this.disabled) return;
    
    const previousPageIndex = this.pageIndex;
    const newPageIndex = Math.floor((this.pageIndex * this.pageSize) / newSize);
    
    this.pageSize = newSize;
    this.pageIndex = newPageIndex;
    
    this.page.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      previousPageIndex
    });
  }

  private changePage(newIndex: number): void {
    const previousPageIndex = this.pageIndex;
    this.pageIndex = newIndex;
    
    this.page.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      previousPageIndex
    });
  }
}
