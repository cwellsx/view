import { ImageSummary } from "./image";
import { TagSummary } from "./tag";

export interface SiteMap {
  images: ReadonlyArray<ImageSummary>,
  tags: ReadonlyArray<TagSummary>
}
