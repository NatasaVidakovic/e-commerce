import { Component, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsTabComponent } from './analytics-tab/analytics-tab.component';
import { ReportsTabComponent } from './reports-tab/reports-tab.component';

@Component({
  selector: 'app-analytics-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
    AnalyticsTabComponent,
    ReportsTabComponent
  ],
  templateUrl: './analytics-reports.component.html',
  styleUrl: './analytics-reports.component.scss'
})
export class AnalyticsReportsComponent implements OnInit {
  activeTabIndex = 0;

  ngOnInit(): void {
    // Initialize component
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }
}
