import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { VoucherService } from '../../../../core/services/voucher.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { TranslatePipe } from '@ngx-translate/core';

export interface VoucherStatusChange {
  id: number;
  voucherId: number;
  isActive: boolean;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

@Component({
  selector: 'app-voucher-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    TranslatePipe
  ],
  templateUrl: './voucher-history-dialog.component.html',
  styleUrls: ['./voucher-history-dialog.component.scss']
})
export class VoucherHistoryDialogComponent {
  history: VoucherStatusChange[] = [];
  loading = true;
  displayedColumns = ['changedAt', 'status', 'changedBy', 'reason'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { voucherId: number; voucherCode: string },
    private voucherService: VoucherService,
    private snackbar: SnackbarService
  ) {
    this.loadHistory();
  }

  loadHistory(): void {
    this.voucherService.getVoucherHistory(this.data.voucherId).subscribe({
      next: (history: VoucherStatusChange[]) => {
        this.history = history;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('VOUCHER.HISTORY_LOAD_FAILED', err);
        this.snackbar.errorFrom(err, 'VOUCHER.HISTORY_LOAD_FAILED');
        this.loading = false;
      }
    });
  }
}
