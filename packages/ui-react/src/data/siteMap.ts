import { ImageSummary } from "./image";
import { TagCount } from "./tag";

export interface SiteTagCount extends TagCount {
  title: string;
}

export interface SiteMap {
  images: ReadonlyArray<ImageSummary>;
  tags: ReadonlyArray<SiteTagCount>;
}
