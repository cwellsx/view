import { ImageSummary } from "./ImageSummary";
import { ImageLayers } from "./ImageLayers";

export interface Image {
  summary: ImageSummary;
  src: string;
  layers: ImageLayers;
}
