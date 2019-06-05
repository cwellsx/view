import * as path from "path";
import * as fs from "fs";
import { readLayers } from "./readLayers";
// import {Image} from "../../src/data";

/*
  Webpack wants us to import any static assets (e.g. jpegs) which we use.
  And the name of an imported module must be hard-coded, a string literal (not a variable).
  So I guess the only solution is for this to emit a *.ts file (not e.g. a *.json file)
  which includes the necessary import statements.
*/

const output: string[] = [];

function appendLine(line = "") {
  output.push(line);
}

function ensureDir(dirName: string): void {
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
  }
}

appendLine("/* Do not edit -- this source fle is created programmatically by /prebuild_data/src/readImages.ts */")

// this is the expected format of the `image.json` file
interface Json {
  "name": string,
  "image": { "src": string, "height": number, "width": number },
  "layersWidth": string
};

export function readImages(inputImages: string, outputImages: string, rootOutputDir: string): string[] {
  appendLine('import * as I from "../data";');

  const images: string[] = [];
  const names: string[] = [];

  for (let i = 1; ; ++i) {
    const subdir = path.join(inputImages, "" + i);
    if (!fs.existsSync(subdir)) {
      break;
    }
    // read the text files
    const imageJson = fs.readFileSync(path.join(subdir, "image.json"), "utf8");
    const summaryMd = fs.readFileSync(path.join(subdir, "summary.md"), "utf8");
    const layersTxtFilename = path.join(subdir, "layers.txt");
    const layersTxt = fs.existsSync(layersTxtFilename) ? fs.readFileSync(layersTxtFilename, "utf8") : undefined;

    // parse the json
    const json = <Json>JSON.parse(imageJson);

    // copy the image
    const imageDir = path.join(rootOutputDir, "image." + i);
    ensureDir(imageDir);
    fs.copyFileSync(path.join(subdir, json.image.src), path.join(imageDir, json.image.src));

    // create an import statement for the image
    const importName = "imageSrc" + i;
    appendLine(`import ${importName} from "./${"image." + i}/${json.image.src}"`);

    // fabricate the layers if there are any
    const layers = layersTxt ? readLayers(layersTxt) : undefined;

    // build the I.Image object
    // we can't build as an object and serialize the JSON because
    // JSON can't contain the importName as an element value
    // so instead we define it using a string template
    appendLine(`
const image${i}: I.Image = {
  id: ${i},
  name: "${json.name}",
  summary: \`${summaryMd}\`,
  image: { src: ${importName}, height: ${json.image.height}, width: ${json.image.width} },
  layers: ${!layers ? "undefined" : JSON.stringify(layers)},
  layersWidth: "${json.layersWidth}"
};
`);

    // add to the list of defined images
    images.push(`image${i}`);

    // remember the name
    names.push(json.name);
  }

  appendLine(`export function loadImages(): I.Image[] { return [${images.join(", ")}]; }`);

  fs.writeFileSync(outputImages, output.join("\n"), "utf8");
  return names;
}
