import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ShipmentService } from '../../shared/services/shipment.service';
import { CustomerService } from '../../shared/services/customer.service';
import { Customer } from '../../shared/models/customer.model';
import {
  ListShipmentsQuery,
  Shipment,
  ShipmentListResponse,
  ShipmentStatus,
} from '../../shared/models/shipment.model';
import { STATUS_LABELS, STATUS_OPTIONS } from '../../shared/constants/shipment-status.constants';
import { formatLateBy } from '../../shared/utils/lateness.utils';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  templateUrl: './shipment-list.component.html',
  styleUrl: './shipment-list.component.css',
})
export class ShipmentListComponent implements OnInit {
  private readonly shipmentService = inject(ShipmentService);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  private searchTimeout: number | null = null;

  readonly columns = ['route', 'customer', 'status', 'promisedDate', 'late', 'edit'];
  readonly statusOptions = STATUS_OPTIONS;

  readonly searchFilter = signal('');
  readonly statusFilter = signal('');
  readonly customerFilter = signal('');
  readonly lateFilter = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly isLoading = signal(false);
  readonly response = signal<ShipmentListResponse | null>(null);
  readonly customers = signal<Customer[]>([]);

  ngOnInit() {
    this.customerService.getAll().subscribe({
      next: (list) => this.customers.set(list),
    });
    this.load();
  }

  load() {
    this.isLoading.set(true);
    const query: ListShipmentsQuery = {
      search: this.searchFilter() || undefined,
      status: this.statusFilter() || undefined,
      customerId: this.customerFilter() || undefined,
      late: this.lateFilter() ? 'true' : undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    };
    this.shipmentService.getAll(query).subscribe({
      next: (res) => {
        res.data.sort((a, b) => {
          if (a.isLate && !b.isLate) return -1;
          if (!a.isLate && b.isLate) return 1;
          return b.lateByMs - a.lateByMs;
        });
        this.response.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  statusLabel(status: ShipmentStatus): string {
    return STATUS_LABELS[status];
  }

  readonly formatLateBy = formatLateBy;

  onSearch(event: Event) {
    this.searchFilter.set((event.target as HTMLInputElement).value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 400);
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onCustomerChange(value: string) {
    this.customerFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onLateToggle(checked: boolean) {
    this.lateFilter.set(checked);
    this.page.set(1);
    this.load();
  }

  onPage(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onRowClick(row: Shipment) {
    this.router.navigate(['/shipments', row.id]);
  }

  clearFilters() {
    this.searchFilter.set('');
    this.statusFilter.set('');
    this.customerFilter.set('');
    this.lateFilter.set(false);
    this.page.set(1);
    this.load();
  }
}
