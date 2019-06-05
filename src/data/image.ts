import { IdName } from "./id";
import { ImageLayers } from "./imageLayers";

export type ImageSummary = IdName & {
  summary: string
}

export type Image = ImageSummary & {
  image: { src: string, height: number, width: number };
  layers?: ImageLayers;
  layersWidth: string;
}
