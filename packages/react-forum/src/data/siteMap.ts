import { ImageSummary } from "./image";
import { TagCount } from "./tag";

export interface SiteMap {
  images: ReadonlyArray<ImageSummary>,
  tags: ReadonlyArray<TagCount & { title: string }>
}
