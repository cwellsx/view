import { Key } from "./id";

// as well as the key which identifies a tag, this has a count of how ofte it's used, and its summary of how to use it
export interface TagCount extends Key {
  summary?: string;
  count: number;
}
