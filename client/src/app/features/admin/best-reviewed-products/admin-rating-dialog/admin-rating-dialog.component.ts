import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface AdminRatingDialogData {
  productIds: number[];
}

export interface AdminRatingDialogResult {
  productIds: number[];
  rating: number;
}

@Component({
  selector: 'admin-rating-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ 'ADMIN.BEST_REVIEWED.RATING_DIALOG.TITLE' | translate }}</h2>
    <div mat-dialog-content>
      <p class="mb-4">{{ 'ADMIN.BEST_REVIEWED.RATING_DIALOG.MESSAGE' | translate:{count: data.productIds.length} }}</p>
      
      <div class="flex items-center gap-2 mb-4">
        <div class="flex gap-1">
          <button *ngFor="let star of [1,2,3,4,5]"
            mat-icon-button
            (click)="rating = star"
            [color]="star <= rating ? 'warn' : ''">
            <mat-icon>{{ star <= rating ? 'star' : 'star_border' }}</mat-icon>
          </button>
        </div>
        <span class="text-lg font-semibold ml-2">{{ rating }}/5</span>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ 'ADMIN.BEST_REVIEWED.RATING_DIALOG.RATING_LABEL' | translate }}</mat-label>
        <input matInput type="number" [(ngModel)]="rating" min="1" max="5" step="0.5">
        <mat-hint>{{ 'ADMIN.BEST_REVIEWED.RATING_DIALOG.RATING_HINT' | translate }}</mat-hint>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!isValid()">
        {{ 'COMMON.SAVE' | translate }}
      </button>
    </div>
  `
})
export class AdminRatingDialogComponent {
  rating = 5;

  constructor(
    public dialogRef: MatDialogRef<AdminRatingDialogComponent, AdminRatingDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: AdminRatingDialogData
  ) {}

  isValid(): boolean {
    return this.rating >= 1 && this.rating <= 5;
  }

  save() {
    if (!this.isValid()) return;
    this.dialogRef.close({
      productIds: this.data.productIds,
      rating: this.rating
    });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
