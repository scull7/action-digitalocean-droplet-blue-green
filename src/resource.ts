export enum ResourceType {
  DROPLET = "droplet",
  IMAGE = "image",
  VOLUME = "volume",
  VOLUMESNAPSHOT = "volume_snapshot",
}

export interface IResource {
  resource_id: string,
  resource_type: ResourceType,
}
