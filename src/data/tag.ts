import { Key } from "./id";
import { TagsRange } from "./range";

// as well as the key which identifies a tag, this has a count of how often it's used, and its summary of how to use it
export interface TagCount extends Key {
  summary?: string;
  count: number;
}

export interface Tags {
  range: TagsRange;
  tagCounts: TagCount[];
}
