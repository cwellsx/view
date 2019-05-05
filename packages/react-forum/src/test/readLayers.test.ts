import * as path from "path";
import { readLayers } from "./readLayers";

it('renders without crashing', () => {
  const filename = path.join(__dirname, "../mock-data/layers.txt");
  readLayers(filename);
});
