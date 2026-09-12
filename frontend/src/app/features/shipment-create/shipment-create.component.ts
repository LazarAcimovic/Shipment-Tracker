import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
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

  readonly customers = signal<Customer[]>([]);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly fieldErrors = signal<Partial<Record<string, string>>>({});
  readonly isValid = signal(false);

  readonly form = new FormGroup({
    customerId: new FormControl<string>('', { nonNullable: true }),
    origin: new FormControl<string>('', { nonNullable: true }),
    destination: new FormControl<string>('', { nonNullable: true }),
    promisedDeliveryDate: new FormControl<Date | null>(null),
  });

  readonly today = new Date();

  ngOnInit() {
    this.customerService.getAll().subscribe({
      next: (list) => this.customers.set(list),
    });

    this.form.valueChanges.subscribe(() => this.validate());
  }

  private validate(): boolean {
    const v = this.form.value;
    const result = createShipmentSchema.safeParse({
      customerId: v.customerId,
      origin: v.origin,
      destination: v.destination,
      promisedDeliveryDate: v.promisedDeliveryDate,
    });

    if (result.success) {
      this.fieldErrors.set({});
      this.isValid.set(true);
      return true;
    }

    const errors: Partial<Record<string, string>> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!errors[field]) errors[field] = issue.message;
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

    this.shipmentService.create({
      customerId: v.customerId!,
      origin: v.origin!,
      destination: v.destination!,
      promisedDeliveryDate: v.promisedDeliveryDate!.toISOString(),
    }).subscribe({
      next: (created) => this.router.navigate(['/shipments', created.id]),
      error: (err) => {
        this.submitError.set(err.error?.message ?? 'Failed to create shipment.');
        this.isSubmitting.set(false);
      },
    });
  }
}
