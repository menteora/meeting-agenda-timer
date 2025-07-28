
export enum ActivityStatus {
  Pending = 'pending',
  Active = 'active',
  Completed = 'completed',
}

export interface Activity {
  id: string;
  name: string;
  plannedDuration: number; // in seconds
  actualDuration: number | null;
  startTime: Date | null;
  endTime: Date | null;
  status: ActivityStatus;
}
