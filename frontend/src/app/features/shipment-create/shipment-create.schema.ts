import { z } from 'zod';

export const createShipmentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  promisedDeliveryDate: z.date({ error: 'Promised delivery date is required' }),
});

export type CreateShipmentFields = z.infer<typeof createShipmentSchema>;
