import type { IRegion } from './region';

export enum ActionStatus {
  COMPLETED = 'completed',
  ERRORED = 'errored',
  IN_PROGRESS = 'in-progress',
}

export interface IAction {
  id: string,
  status: ActionStatus,
  type: string,
  started_at: Date,
  completed_at: Date,
  resource_id: string,
  resource_type: string,
  region: IRegion,
  region_slug: string,
}
