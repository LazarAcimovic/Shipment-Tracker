import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  CreateShipment,
  ListShipmentsQuery,
  RecordShipmentEvent,
  Shipment,
  ShipmentDetail,
  ShipmentListResponse,
} from '../models/shipment.model';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/shipments`;

  getAll(query: ListShipmentsQuery = {}) {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.customerId) params = params.set('customerId', query.customerId);
    if (query.late) params = params.set('late', query.late);
    if (query.search) params = params.set('search', query.search);
    if (query.page != null) params = params.set('page', query.page);
    if (query.pageSize != null) params = params.set('pageSize', query.pageSize);
    return this.http.get<ShipmentListResponse>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ShipmentDetail>(`${this.base}/${id}`);
  }

  create(body: CreateShipment) {
    return this.http.post<ShipmentDetail>(this.base, body);
  }

  update(id: string, body: CreateShipment) {
    return this.http.put<ShipmentDetail>(`${this.base}/${id}`, body);
  }

  recordEvent(id: string, body: RecordShipmentEvent) {
    return this.http.post<ShipmentDetail>(`${this.base}/${id}/events`, body);
  }
}
