import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShipmentService } from '../../shared/services/shipment.service';
import {
  ShipmentDetail,
  ShipmentStatus,
} from '../../shared/models/shipment.model';
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
    MatDialogModule,
  ],
  templateUrl: './shipment-detail.component.html',
  styleUrl: './shipment-detail.component.css',
})
export class ShipmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shipmentService = inject(ShipmentService);
  private readonly dialog = inject(MatDialog);

  readonly isLoading = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly detail = signal<ShipmentDetail | null>(null);
  readonly isSubmitting = signal(false);
  readonly isDeleting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = new FormGroup({
    status: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    location: new FormControl<string>('', { nonNullable: true }),
    note: new FormControl<string>('', { nonNullable: true }),
  });

  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  readonly formatLateBy = formatLateBy;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.isLoading.set(true);
    this.shipmentService.getById(id).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.isLoading.set(false);
      },
      error: () => {
        this.pageError.set('Failed to load shipment.');
        this.isLoading.set(false);
      },
    });
  }

  statusLabel(status: ShipmentStatus): string {
    return STATUS_LABELS[status];
  }

  onDelete() {
    const d = this.detail();
    if (!d) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete shipment', message: 'Delete this shipment? This cannot be undone.' },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.isDeleting.set(true);
      this.shipmentService.delete(d.id).subscribe({
        next: () => this.router.navigate(['/']),
        error: () => {
          this.pageError.set('Failed to delete shipment.');
          this.isDeleting.set(false);
        },
      });
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const d = this.detail();
    if (!d) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const { status, location, note } = this.form.value;

    this.shipmentService
      .recordEvent(d.id, {
        status: status!,
        location: location || undefined,
        note: note || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.detail.set(updated);
          this.formDirective.resetForm();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.submitError.set(err.error?.message ?? 'Failed to record event.');
          this.isSubmitting.set(false);
        },
      });
  }
}
