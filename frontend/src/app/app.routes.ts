import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/shipment-list/shipment-list.component').then(
        (m) => m.ShipmentListComponent,
      ),
  },
  {
    path: 'shipments/new',
    loadComponent: () =>
      import('./features/shipment-create/shipment-create.component').then(
        (m) => m.ShipmentCreateComponent,
      ),
  },
  {
    path: 'shipments/:id',
    loadComponent: () =>
      import('./features/shipment-detail/shipment-detail.component').then(
        (m) => m.ShipmentDetailComponent,
      ),
  },
];
