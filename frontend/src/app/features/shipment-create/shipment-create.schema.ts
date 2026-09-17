import { z } from 'zod';

export const createShipmentSchema = z
  .object({
    customerId: z.string().min(1, 'Customer is required'),
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    promisedDeliveryDate: z.date({ error: 'Promised delivery date is required' }),
  })
  .refine(
    (d) => d.origin.trim().toLowerCase() !== d.destination.trim().toLowerCase(),
    { message: 'Origin and destination must be different', path: ['destination'] },
  );

export type CreateShipmentFields = z.infer<typeof createShipmentSchema>;
