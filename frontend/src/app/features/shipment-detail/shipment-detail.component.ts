import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShipmentService } from '../../shared/services/shipment.service';
import { ShipmentDetail, ShipmentStatus } from '../../shared/models/shipment.model';
import { STATUS_LABELS } from '../../shared/constants/shipment-status.constants';
import { formatLateBy } from '../../shared/utils/lateness.utils';

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './shipment-detail.component.html',
  styleUrl: './shipment-detail.component.css',
})
export class ShipmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly shipmentService = inject(ShipmentService);

  readonly isLoading = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly detail = signal<ShipmentDetail | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = new FormGroup({
    status: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    location: new FormControl<string>('', { nonNullable: true }),
    note: new FormControl<string>('', { nonNullable: true }),
  });

  readonly formatLateBy = formatLateBy;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.isLoading.set(true);
    this.shipmentService.getById(id).subscribe({
      next: (d) => { this.detail.set(d); this.isLoading.set(false); },
      error: () => { this.pageError.set('Failed to load shipment.'); this.isLoading.set(false); },
    });
  }

  statusLabel(status: ShipmentStatus): string {
    return STATUS_LABELS[status];
  }

  onSubmit() {
    if (this.form.invalid) return;
    const d = this.detail();
    if (!d) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const { status, location, note } = this.form.value;

    this.shipmentService.recordEvent(d.id, {
      status: status!,
      location: location || undefined,
      note: note || undefined,
    }).subscribe({
      next: (updated) => {
        this.detail.set(updated);
        this.form.reset();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.submitError.set(err.error?.message ?? 'Failed to record event.');
        this.isSubmitting.set(false);
      },
    });
  }
}
