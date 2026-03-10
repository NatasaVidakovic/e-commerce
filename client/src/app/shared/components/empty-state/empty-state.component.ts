import { Component, inject, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { BusyService } from '../../../core/services/busy.service';

@Component({
  selector: 'app-empty-state',
  imports: [
    MatIcon,
    MatButton
  ],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  busyService = inject(BusyService);
  message = input.required<string>();
  icon = input<string>('info');
  actionText = input<string | null>(null);
  action = output<void>();

  onAction() {
    this.action.emit();
  }
}
