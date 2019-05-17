import { PageType } from "../io/pageId";
import { IdName, Key } from "./Id";

export interface Tag extends Key {
  summary?: string;
  markdown?: string;
}

export interface TagSummary extends Key {
  summary?: string;
}

/*
  When TagId is a Key then it identifies a Tag.

  Otherwise it identifies e.g. an Image (or possibly some other type of content)

  TagId is used instead of Key in a Discussion, so discussions can be associated with any content, e.g. tags or images.
*/

export type TagId = Key | {
  pageType: PageType;
  what: IdName;
};

export function isTagIdKey(tag: TagId): tag is Key {
  return (tag as Key).key !== undefined;
}

export function getTagIdText(tag: TagId): string {
  return isTagIdKey(tag) ? tag.key : tag.what.name;
}
