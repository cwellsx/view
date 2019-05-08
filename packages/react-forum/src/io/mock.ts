import * as I from "../data";
import imageSrc from "../mock-data/Hereford-Karte.jpg"
import { PageId, getPageUrl } from "./pageId";

export function mockServer(pageId: PageId): object | undefined {
  console.log(`mockServer getting ${getPageUrl(pageId)}`);
  if (pageId.pageType === "SiteMap") {
    return siteMap;
  }
  if (pageId.pageType === "Login") {
    return loginUser;
  }
  if (pageId.pageType === "Image") {
    return image;
  }
  if (pageId.pageType === "User") {
    if (!pageId.id) {
      return users;
    } else {
      const requested = pageId.id;
      if (Array.isArray(requested)) {
        // should return 404
        return undefined;
      } else {
        return users.find(x => x.idName.id === requested.id);
      }
    }
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

const users: I.UserSummary[] = [
  loginUser,
  { gravatarHash: "25bfdecf63c3495489123fe9000833e1", idName: { id: 2, name: "JanineD" }, location: "Paris" },
  { gravatarHash: "35bfdecf63c3495489123fe9000833e1", idName: { id: 3, name: "Andy" }, location: "London" },
  { gravatarHash: "45bfdecf63c3495489123fe9000833e1", idName: { id: 4, name: "D. Smith" }, location: "Bristol" },
  { gravatarHash: "55bfdecf63c3495489123fe9000833e1", idName: { id: 5, name: "Annette" }, location: "Boston" },
  { gravatarHash: "65bfdecf63c3495489123fe9000833e1", idName: { id: 6, name: "HH" }, location: "Edinburgh" },
  { gravatarHash: "75bfdecf63c3495489123fe9000833e1", idName: { id: 7, name: "Wolfgang" }, location: "Berlin" },
  { gravatarHash: "85bfdecf63c3495489123fe9000833e1", idName: { id: 8, name: "王秀英" } },
  { gravatarHash: "95bfdecf63c3495489123fe9000833e1", idName: { id: 9, name: "李敏" } },
  { gravatarHash: "10bfdecf63c3495489123fe9000833e1", idName: { id: 10, name: "李娜" } },
].sort((x,y) => x.idName.name.localeCompare(y.idName.name));

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
export const featureSummaries: I.FeatureSummary[] = featureNames.map((value, index) => {
  return { idName: { id: index, name: value } };
});

/*
  Sitemap
*/

const siteMap: I.SiteMap = {
  images: [imageSummary],
  features: featureSummaries
};

