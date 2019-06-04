import * as I from "../data";
import { ResourceType } from "../shared/request";
import { WireMessage, WireDiscussionMeta } from "../shared/wire";

/*
  This defines 'bare' data formats i.e. the format in which data is stored on disk before it's loaded.

  For any given data type (e.g. named `Data`) defined in `/src/data/Data`, there may also be:

  - `WireData` (also defined in `/src/io/Wire`)
  - `BareData` (defined in this `/src/server/bare`)

  Only a "data" format is used in the `/src/react` code.

  A "wire" format is used on the network connection between server and client.
  It's easily converted to data, but reduces redundency i.e. duplication of --
  for example all messages have a user, a user may have several messages, so instead of transporting multiple
  instances of user data, the data for each user is sent once, and messages include a user ID.

  A "bare" format is intended for the server's storing of data on disk.
*/

// This is "bare" because it defines persistent tag data but not the associated usage count
export interface BareTopic {
  title: string;
  summary?: string;
  markdown?: string;
  userId: number;
  dateTime: string;
}

export const summaryLength = { min: 20, max: 460 };

export type BareTag = BareTopic & I.Key;

// this isn't persisted on disk but is used like database might creates an index for a table
export interface BareTagCount extends I.Key {
  count: number;
}

// When TagId is a Key then it identifies a Tag,
// otherwise it identifies e.g. an Image (or possibly some other type of content)
// TagId is used instead of Key in BareDiscussionMeta, so discussions can be associated with tags or, e.g. with images.
export type TagId = I.Key | {
  resourceType: ResourceType;
  what: I.IdName;
};

export function isTagIdKey(tag: TagId): tag is I.Key {
  return (tag as I.Key).key !== undefined;
}

export function getTagText(title: string) {
  // preserve only alphanumeric and whitespace, then convert all whitespace, then toLower
  return title.replace(/[^A-Za-z0-9 ]/, "").replace(/ /g, "-").toLocaleLowerCase();
}

// if data for each user is stored in a separate (numbered) directory
// then this defines the data which would be stored in each directory
export interface BareUser {
  name: string;
  email: string;
  dateTime: string;
  gravatarHash: string;
  // TODO: add some authentication or credential data somewhere e.g. here
  profile: I.UserProfile;
  favourites: TagId[];
}

export type BareMessage = WireMessage;

// FIXME!

export type BareDiscussionMeta = WireDiscussionMeta;

export interface BareDiscussion {
  meta: BareDiscussionMeta;
  first: BareMessage;
  messages: BareMessage[];
}
