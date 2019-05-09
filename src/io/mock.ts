import * as I from "../data";
import imageSrc from "../mock-data/Hereford-Karte.jpg"
import { PageId, getPageUrl } from "./pageId";
import { UserProfile } from "../data";

export function mockServer(pageId: PageId, userIdLogin?: number): object | undefined {
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
      return getUserSummaries();
    } else {
      const requested = pageId.id;
      if (Array.isArray(requested)) {
        // should return 404
        return undefined;
      } else {
        return getUser(requested.id, userIdLogin);
      }
    }
  }
  return undefined;
}

/*
  Users
*/

// if data for each user is stored in a separate (numbered) directory
// then this defines the data which would be stored in each directory
interface BareUser {
  name: string;
  email: string;
  gravatarHash: string;
  // TODO: add some authentication or credential data somewhere e.g. here
  profile: I.UserProfile
  favourites: I.FavouriteId[];
}

const allUsers: Map<number, BareUser> = new Map<number, BareUser>([
  [1, {
    name: "ChrisW",
    email: "cwellsx@gmail.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e1",
    profile: {
      location: "Normandy",
      aboutMe: `I wrote this!
        
Further details are to be supplied ...`
    },
    favourites: []
  }],
  [2, {
    name: "JanineD",
    email: "2@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e2",
    profile: { location: "Paris" }, favourites: []
  }],
  [3, {
    name: "Andy",
    email: "3@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e3",
    profile: { location: "London" }, favourites: []
  }],
  [4, {
    name: "D. Smith",
    email: "4@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e4",
    profile: { location: "Bristol" }, favourites: []
  }],
  [5, {
    name: "Annette",
    email: "5@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e5",
    profile: { location: "Boston" }, favourites: []
  }],
  [6, {
    name: "HH",
    email: "6@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e6",
    profile: { location: "Edinburgh" }, favourites: []
  }],
  [7, {
    name: "Wolfgang",
    email: "7@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e7",
    profile: { location: "Berlin" }, favourites: []
  }],
  [8, {
    name: "王秀英",
    email: "8@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e8",
    profile: {}, favourites: []
  }],
  [9, {
    name: "李敏",
    email: "9@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e9",
    profile: {}, favourites: []
  }],
  [10, {
    name: "李娜",
    email: "10@mailinator.com",
    gravatarHash: "75bfdecf63c3495489123fe9c0b833e0",
    profile: {}, favourites: []
  }],
]);

function getUserSummaryFrom(userId: number, data: BareUser): I.UserSummary {
  return {
    idName: { id: userId, name: data.name },
    gravatarHash: data.gravatarHash,
    location: data.profile.location
  }
}

function getUserSummaries(): I.UserSummary[] {
  const rc: I.UserSummary[] = [];
  allUsers.forEach((data, userId) => rc.push(getUserSummaryFrom(userId, data)));
  return rc.sort((x, y) => x.idName.name.localeCompare(y.idName.name));
}

function getUserSummary(userId: number): I.UserSummary | undefined {
  const data: BareUser | undefined = allUsers.get(userId);
  if (!data) {
    return undefined;
  }
  return getUserSummaryFrom(userId, data);
}

function getUser(userId: number, userIdLogin?: number): I.User | undefined {
  const data: BareUser | undefined = allUsers.get(userId);
  if (!data) {
    return undefined;
  }
  const preferences: I.UserPreferences | undefined = (userId !== userIdLogin) ? undefined : {
    email: data.email
  };
  return {
    summary: getUserSummaryFrom(userId, data),
    profile: data.profile,
    preferences: preferences
  };
}

export function loginUser(): I.UserSummary {
  return getUserSummary(1)!;
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

const featureNames: string[] = assertTypeT<string[]>(require("../mock-data/features.json"), ["foo"]);

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

/*
  load data from json files
*/

function assertType(found: any, wanted: any): void {
  if (typeof wanted !== typeof found) {
    throw new Error(`assertType expected ${typeof wanted} but found ${typeof found}`);
  }
  switch (typeof wanted) {
    case "boolean":
    case "number":
    case "string":
      return; // primitive vaue type -- done checking
    case "object":
      break; // more to check
    case "undefined":
    case "symbol":
    case "function":
    default:
      throw new Error(`assertType does not support ${typeof wanted}`);
  }
  if (Array.isArray(wanted)) {
    if (!Array.isArray(found)) {
      throw new Error(`assertType expected an array but found ${found}`);
    }
    for (const element of found) {
      assertType(element, wanted[0]);
    }
    return;
  }
  for (const element in wanted) {
    assertType(found[element], wanted[element]);
  }
}

function assertTypeT<T>(loaded: any, wanted: T): T {
  assertType(loaded, wanted);
  return loaded as T;
}
