export interface HomeworkActivityDto {
  id: string;
  homeworkId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomeworkSubmissionDto {
  id: string;
  sessionId: string;
  clientId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';
  submittedAt?: Date;
  completedAt?: Date;
  notes?: string;
  fileUrl?: string;
  activities?: HomeworkActivityDto[];
  createdAt: Date;
  updatedAt: Date;
  // Relations
  session?: {
    id: string;
    appointment?: {
      id: string;
      startTime: Date;
    };
    homework?: string;
  };
}

export interface CreateHomeworkSubmissionDto {
  sessionId: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  fileUrl?: string;
}

export interface UpdateHomeworkSubmissionDto {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';
  notes?: string;
  fileUrl?: string;
}

export interface CreateHomeworkActivityDto {
  homeworkId: string;
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateHomeworkActivityDto {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  order?: number;
}

