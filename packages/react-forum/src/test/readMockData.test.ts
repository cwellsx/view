import * as path from "path";
import { readLayers } from "./readLayers";
import { readFeatures } from "./readFeatures";
import { readDiscussions } from "./readDiscussions";

// it('parses layers', () => {
//   const filename = path.join(__dirname, "../mock-data/layers.txt");
//   readLayers(filename);
// });

// it('parses features', () => {
//   const filename = path.join(__dirname, "../mock-data/features.txt");
//   readFeatures(filename);
// });

it('parses discussions', () => {
  const filename = path.join(__dirname, "../mock-data/random.txt");
  readDiscussions(filename);
});
