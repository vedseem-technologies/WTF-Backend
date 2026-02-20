import { z } from 'zod';

export const createOrderSchema = z.object({
  entityType: z.enum(['occasion', 'service', 'category', 'package'], {
    required_error: "Entity type is required",
    invalid_type_error: "Invalid entity type"
  }),
  entityId: z.string({
    required_error: "Entity ID is required"
  }).min(1, "Entity ID cannot be empty"),
  items: z.array(z.object({
    itemId: z.string().optional(),
    name: z.string({ required_error: "Item name is required" }),
    category: z.string().optional(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price must be non-negative"),
    baseQuantity: z.number().optional(),
    measurement: z.string().optional(),
    type: z.string().optional(),
    image: z.string().optional()
  })).min(1, "Order must contain at least one item"),
  bookingDetails: z.object({
    date: z.string({ required_error: "Booking date is required" }),
    time: z.string({ required_error: "Booking time is required" }),
    vegGuests: z.number().optional(),
    nonVegGuests: z.number().optional()
  }, { required_error: "Booking details are required" }),
  totalAmount: z.number({ required_error: "Total amount is required" }).min(0),
  paymentMethod: z.enum(['zoho', 'cod'], { required_error: "Payment method is required" }).optional(),
  address: z.string({
    required_error: "Delivery address is required"
  }).min(5, "Address must be at least 5 characters long"),
  notes: z.string().optional()
});
