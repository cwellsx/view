import { IdName } from "./Id";
import { ImageLayers } from "./ImageLayers";

export interface Image {
  summary: ImageSummary;
  image: { src: string, height: number, width: number };
  layers?: ImageLayers;
  layersWidth: string;
}

export interface ImageSummary {
  idName: IdName,
  summary: string
}
