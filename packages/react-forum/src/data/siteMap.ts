import { ImageSummary } from "./image";
import { TagCount } from "./tag";

export type SiteTagCount = TagCount & { title: string };

export interface SiteMap {
  images: ReadonlyArray<ImageSummary>,
  tags: ReadonlyArray<SiteTagCount>
}
