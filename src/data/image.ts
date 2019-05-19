import { IdName } from "./id";
import { ImageLayers } from "./imageLayers";

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
