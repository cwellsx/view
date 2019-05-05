import * as I from "../data";
import imageSrc from "../mock-data/Hereford-Karte.jpg"

const imageSummary: I.ImageSummary = {
  idName: { id: 1, name: "Mappa Mundi" },
  summary: `This is a very interesting map, worthy of much discussion.

And this description of it has two paragraphs, with some **bold** text,
so you can see this text can be formatted -- it's actually created in one of the
[Markdown](https://en.wikipedia.org/wiki/Markdown) formats.`
};

export const siteMap: I.SiteMap = {
  images: [imageSummary]
};

export const loginUser: I.UserSummary = {
  idName: { id: 1, name: "JohnS" },
  gravatarHash: "75bfdecf63c3495489123fe9c0b833e1",
  location: "London"
}

const imageLayers: I.ImageLayers = require("../mock-data/layers.json");

export const image: I.Image = {
  summary: imageSummary,
  image: { src: imageSrc, height: 5355, width: 4606 },
  layers: imageLayers,
  layersWidth: "14em"
}
