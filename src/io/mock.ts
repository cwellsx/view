import * as I from "../data";
import imageSrc from "../mock-data/Hereford-Karte.jpg"
import { PageId } from "./pageId";

export function mockServer(pageId: PageId): object | undefined {
  if (pageId.pageType === "SiteMap") {
    return siteMap;
  }
  if (pageId.pageType === "Login") {
    return loginUser;
  }
  if (pageId.pageType === "Image") {
    return image;
  }
  return undefined;
}

/*
  Users
*/

export const loginUser: I.UserSummary = {
  idName: { id: 1, name: "ChrisW" },
  gravatarHash: "75bfdecf63c3495489123fe9c0b833e1",
  location: "Normandy"
}

/*
  Images
*/

const imageSummary: I.ImageSummary = {
  idName: { id: 1, name: "Mappa Mundi" },
  summary: `This is a very interesting map, worthy of much discussion.

And this description of it has two paragraphs, with some **bold** text,
so you can see this text can be formatted -- it's actually created in one of the
[Markdown](https://en.wikipedia.org/wiki/Markdown) formats.`
};

const imageLayers: I.ImageLayers = require("../mock-data/layers.json");

const image: I.Image = {
  summary: imageSummary,
  image: { src: imageSrc, height: 5355, width: 4606 },
  layers: imageLayers,
  layersWidth: "14em"
}

/*
  Features
*/

const featureNames: string[] = require("../mock-data/features.json");
const featureSummaries: I.FeatureSummary[] = featureNames.map((value, index) => {
  return { idName: { id: index, name: value } };
});

/*
  Sitemap
*/

const siteMap: I.SiteMap = {
  images: [imageSummary],
  features: featureSummaries
};

