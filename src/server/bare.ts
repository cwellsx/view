import * as I from "../data";
import { ResourceType } from "../shared/urls";
import { WireMessage } from "../shared/wire";

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

export type BareTag = BareTopic & I.Key;

// this isn't persisted on disk but is used like database might creates an index for a table
export interface BareTagCount extends I.Key {
  count: number;
}

// When TagId is a Key then it identifies a Tag,
// otherwise it identifies e.g. an Image (or possibly some other type of content)
// TagId is used instead of Key in BareDiscussion, so discussions can be associated with tags or, e.g. with images.
export type Tag = { tag: string };
export type TagId = Tag | { resourceType: ResourceType, id: number };

export function isTag(tag: TagId): tag is Tag {
  return (tag as Tag).tag !== undefined;
}

// if data for each user is stored in a separate (numbered) directory
// then this defines the data which would be stored in each directory
export interface StoredUser {
  name: string;
  email: string;
  dateTime: string;
  // TODO: add some authentication or credential data somewhere e.g. here
  profile: I.UserProfile;
  favourites: TagId[];
}

export interface BareUser extends StoredUser {
  gravatarHash: string;
}

export type BareMessage = WireMessage;

export interface BareDiscussion extends I.IdName {
  tags: TagId[];
  first: BareMessage;
  messages: BareMessage[];
}
