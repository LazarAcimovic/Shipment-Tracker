import { Customer } from './customer.model';

export type ShipmentStatus =
  | 'CONFIRMED'
  | 'PREPARED'
  | 'PICKED_UP'
  | 'DEPARTED'
  | 'AT_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  occurredAt: string;
}

export interface Shipment {
  id: string;
  customerId: string;
  origin: string;
  destination: string;
  currentStatus: ShipmentStatus;
  promisedDeliveryDate: string;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  isLate: boolean;
  lateByMs: number;
  customer: Customer;
}

export interface ShipmentDetail extends Shipment {
  events: ShipmentEvent[];
  allowedNextStatuses: ShipmentStatus[];
}

export interface ShipmentListResponse {
  data: Shipment[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateShipment {
  customerId: string;
  origin: string;
  destination: string;
  promisedDeliveryDate: string;
}

export interface RecordShipmentEvent {
  status: string;
  location?: string;
  note?: string;
}

export interface ListShipmentsQuery {
  status?: string;
  customerId?: string;
  late?: 'true' | 'false';
  search?: string;
  page?: number;
  pageSize?: number;
}
