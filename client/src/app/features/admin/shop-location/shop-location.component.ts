import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShopLocationService, UpdateShopLocation, ShopLocation } from '../../../core/services/shop-location.service';

@Component({
  selector: 'app-shop-location',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './shop-location.component.html',
  styleUrl: './shop-location.component.scss'
})
export class ShopLocationComponent implements OnInit {
  private shopLocationService = inject(ShopLocationService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  shopLocation = this.shopLocationService.shopLocation;
  loading = this.shopLocationService.loading;
  error = this.shopLocationService.error;
  locationForm: FormGroup;
  saving = signal(false);

  constructor() {
    this.locationForm = this.fb.group({
      latitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      address: ['', Validators.maxLength(500)]
    });

    // Set up effect in constructor for proper injection context
    effect(() => {
      const location = this.shopLocation();
      if (location) {
        this.locationForm.patchValue({
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          address: location.address || ''
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadShopLocation();
  }

  loadShopLocation(): void {
    this.shopLocationService.getShopLocation();
  }

  onSaveLocation(): void {
    if (this.locationForm.invalid) {
      this.markFormGroupTouched(this.locationForm);
      this.snackBar.open('Please fix the validation errors', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    
    const updateData: UpdateShopLocation = {
      latitude: this.locationForm.value.latitude,
      longitude: this.locationForm.value.longitude,
      address: this.locationForm.value.address || undefined
    };

    this.shopLocationService.updateShopLocation(updateData).subscribe({
      next: (updatedLocation: ShopLocation) => {
        this.saving.set(false);
        this.snackBar.open('Shop location updated successfully!', 'Close', { duration: 3000 });
      },
      error: (err: any) => {
        this.saving.set(false);
        this.snackBar.open('Failed to update shop location', 'Close', { duration: 3000 });
        console.error('Error updating shop location:', err);
      }
    });
  }

  onGetCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation is not supported by this browser', 'Close', { duration: 3000 });
      return;
    }

    this.snackBar.open('Getting your current location...', 'Close', { duration: 2000 });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.locationForm.patchValue({
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        });
        this.snackBar.open('Current location retrieved!', 'Close', { duration: 3000 });
      },
      (error) => {
        let errorMessage = 'Failed to get current location';
        if (error.code === 1) {
          errorMessage = 'Location access denied. Please enable location services.';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable. Please try again.';
        } else if (error.code === 3) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 60000 // Allow cached location up to 1 minute old
      }
    );
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper getters for template
  get latitude() { return this.locationForm.get('latitude'); }
  get longitude() { return this.locationForm.get('longitude'); }
  get address() { return this.locationForm.get('address'); }
}
