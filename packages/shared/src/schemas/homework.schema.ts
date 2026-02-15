import { z } from 'zod';

export const createHomeworkSubmissionSchema = z.object({
  sessionId: z.string().cuid(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  notes: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional(),
});

export const updateHomeworkSubmissionSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED']).optional(),
  notes: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional(),
});

