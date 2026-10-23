import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  /** Size of the reporting window in days; the previous window is used for comparison. */
  days: z.coerce.number().int().min(7).max(365).default(90),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
