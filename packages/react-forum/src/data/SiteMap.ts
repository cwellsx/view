import { ImageSummary } from "./Image";
import { TagSummary } from "./Tag";

export interface SiteMap {
  images: ReadonlyArray<ImageSummary>,
  tags: ReadonlyArray<TagSummary>
}
