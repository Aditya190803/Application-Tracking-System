import { z } from 'zod';

import { historyResponseSchema, resumesResponseSchema } from '@/lib/contracts/api';

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
};

export type HistoryResponse = z.infer<typeof historyResponseSchema>;
export type ResumesResponse = z.infer<typeof resumesResponseSchema>;
