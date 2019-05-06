import { ImageSummary } from "./ImageSummary";
import { FeatureSummary } from "./FeatureSummary";

export interface SiteMap {
  images: ReadonlyArray<ImageSummary>,
  features: ReadonlyArray<FeatureSummary>
}
