import { Component, Input, Self } from '@angular/core';
import { FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-text-input',
  imports: [
    MatFormField,
    MatInput,
    MatError,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss'
})
export class TextInputComponent {
    @Input() label = '';
    @Input() type = 'text';

    constructor(@Self() public controlDir: NgControl) {
      this.controlDir.valueAccessor = this;
    }

    writeValue(obj: any): void {
    }

    registerOnChange(fn: any): void {
    }

    registerOnTouched(fn: any): void {
    }

    get control() {
      return this.controlDir.control as FormControl;
    }
}
