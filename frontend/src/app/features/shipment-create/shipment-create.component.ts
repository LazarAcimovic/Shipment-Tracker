import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ShipmentService } from '../../shared/services/shipment.service';
import { CustomerService } from '../../shared/services/customer.service';
import { Customer } from '../../shared/models/customer.model';
import { createShipmentSchema } from './shipment-create.schema';

@Component({
  selector: 'app-shipment-create',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  templateUrl: './shipment-create.component.html',
  styleUrl: './shipment-create.component.css',
})
export class ShipmentCreateComponent implements OnInit {
  private readonly shipmentService = inject(ShipmentService);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private editId: string | null = null;

  readonly customers = signal<Customer[]>([]);
  readonly isSubmitting = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly fieldErrors = signal<Partial<Record<string, string>>>({});
  readonly isValid = signal(false);

  readonly form = new FormGroup({
    customerId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    origin: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    destination: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    promisedDeliveryDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });

  readonly today = new Date();
  private lastEditedRouteField: 'origin' | 'destination' = 'destination';

  get isEditMode(): boolean {
    return this.editId !== null;
  }

  ngOnInit() {
    this.customerService.getAll().subscribe({
      next: (list) => this.customers.set(list),
    });

    this.form.get('origin')!.valueChanges.subscribe(() => { this.lastEditedRouteField = 'origin'; });
    this.form.get('destination')!.valueChanges.subscribe(() => { this.lastEditedRouteField = 'destination'; });
    this.form.valueChanges.subscribe(() => this.validate());

    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.shipmentService.getById(this.editId).subscribe({
        next: (s) => {
          this.form.patchValue({
            customerId: s.customerId,
            origin: s.origin,
            destination: s.destination,
            promisedDeliveryDate: new Date(s.promisedDeliveryDate),
          });
        },
        error: () => this.pageError.set('Failed to load shipment.'),
      });
    }
  }

  private validate(): boolean {
    const v = this.form.value;
    const result = createShipmentSchema.safeParse({
      customerId: v.customerId,
      origin: v.origin,
      destination: v.destination,
      promisedDeliveryDate: v.promisedDeliveryDate,
    });

    const errors: Partial<Record<string, string>> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      }
    }

    const originVal = (v.origin ?? '').trim().toLowerCase();
    const destinationVal = (v.destination ?? '').trim().toLowerCase();
    if (originVal && destinationVal && originVal === destinationVal) {
      const field = this.lastEditedRouteField;
      errors[field] = 'Origin and destination must be different';
      this.form.get(field)!.setErrors({ sameName: true });
    } else {
      for (const name of ['origin', 'destination'] as const) {
        const ctrl = this.form.get(name)!;
        if (ctrl.errors?.['sameName']) {
          ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        }
      }
    }

    if (result.success && Object.keys(errors).length === 0) {
      this.fieldErrors.set({});
      this.isValid.set(true);
      return true;
    }

    this.fieldErrors.set(errors);
    this.isValid.set(false);
    return false;
  }

  onSubmit() {
    if (!this.validate()) return;
    const v = this.form.value;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const body = {
      customerId: v.customerId!,
      origin: v.origin!,
      destination: v.destination!,
      promisedDeliveryDate: v.promisedDeliveryDate!.toISOString(),
    };

    const request = this.editId
      ? this.shipmentService.update(this.editId, body)
      : this.shipmentService.create(body);

    request.subscribe({
      next: (result) => this.router.navigate(['/shipments', result.id]),
      error: (err) => {
        this.submitError.set(err.error?.message ?? 'Failed to save shipment.');
        this.isSubmitting.set(false);
      },
    });
  }
}
