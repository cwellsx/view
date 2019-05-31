import { Key } from "./id";

export interface Tag extends Key {
  summary?: string;
  markdown?: string;
}

export interface TagSummary extends Key {
  summary?: string;
}

export interface TagCount extends Key {
  count: number;
}