import * as I from "../data";
import { BareUser } from "./bare";
import { loadUsers, loadImages, loadFeatures } from "./loader";

/*
  This is an in-RAM database
  or its API wraps an external database.
*/

/*
  Data -- not exported
*/

const allUsers: Map<number, BareUser> = loadUsers();

const allImages: I.Image[] = loadImages();

const allFeatures: I.FeatureSummary[] = loadFeatures();

/*
  helper functions
*/

function getUserSummaryFrom(userId: number, data: BareUser): I.UserSummary {
  return {
    idName: { id: userId, name: data.name },
    gravatarHash: data.gravatarHash,
    location: data.profile.location
  }
}

/*
  GET functions
*/

export function getSiteMap(): I.SiteMap {
  return {
    images: allImages.map(image => image.summary),
    features: allFeatures
  };
}

export function getImage(id: number): I.Image | undefined {
  return allImages.find(image => image.summary.idName.id === id);
}

export function getUserSummaries(): I.UserSummary[] {
  const rc: I.UserSummary[] = [];
  allUsers.forEach((data, userId) => rc.push(getUserSummaryFrom(userId, data)));
  return rc.sort((x, y) => x.idName.name.localeCompare(y.idName.name));
}

export function getUser(userId: number, userIdLogin?: number): I.User | undefined {
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
