import type { IRegion } from './region';

export interface IAction {
  id: string,
  status: string,
  type: string,
  started_at: Date,
  completed_at: Date,
  resource_id: string,
  resource_type: string,
  region: IRegion,
  region_slug: string,
}
