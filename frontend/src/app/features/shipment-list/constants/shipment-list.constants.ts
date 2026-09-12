import { ShipmentStatus } from '../../../shared/models/shipment.model';

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  CONFIRMED: 'Confirmed',
  PREPARED: 'Prepared',
  PICKED_UP: 'Picked up',
  DEPARTED: 'Departed',
  AT_HUB: 'At hub',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
};

export const STATUS_OPTIONS: ShipmentStatus[] = [
  'CONFIRMED', 'PREPARED', 'PICKED_UP', 'DEPARTED',
  'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED',
];
