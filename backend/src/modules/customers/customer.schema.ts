import { CustomerStatus, CustomerType } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';
import {
  emailAddress,
  mobileNumber,
  optionalDate,
  optionalGstNumber,
  optionalText,
  requiredText,
} from '../../utils/validators';

export const createCustomerSchema = z.object({
  name: requiredText('Customer name', 120),
  mobile: mobileNumber,
  email: emailAddress,
  businessName: requiredText('Business name', 150),
  gstNumber: optionalGstNumber,
  type: z.nativeEnum(CustomerType, {
    required_error: 'Customer type is required',
    invalid_type_error: 'Customer type must be RETAIL, WHOLESALE or DISTRIBUTOR',
  }),
  address: requiredText('Address', 500),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: optionalDate('Follow-up date'),
  notes: optionalText('Notes', 2000),
});

/** Edits are partial: only the supplied fields are changed. */
export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  /** Free text match across name, business name, mobile and email. */
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  type: z.nativeEnum(CustomerType).optional(),
  /** Only customers whose follow-up date has arrived or passed. */
  followUpDue: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  sortBy: z.enum(['createdAt', 'name', 'followUpDate', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const customerIdParamSchema = z.object({
  id: z.string().trim().min(1, 'A valid customer id is required'),
});

export const createFollowUpSchema = z.object({
  note: requiredText('Follow-up note', 2000),
  /** Optional next follow-up date; when given it also updates the customer. */
  followUpDate: optionalDate('Follow-up date'),
});

export const listFollowUpsQuerySchema = paginationQuerySchema;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
