// https://stackoverflow.com/questions/42728140/is-it-possible-to-export-as-foo-in-typescript
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#export-star-as-namespace-syntax

export * from "./data";
import * as Data from "./data";
export { Data };

import * as Message from "./messages";
export { Message };

import * as Post from "./messages/post";
export { Post };

import * as Wire from "./messages/wire";
export { Wire };

import * as Url from "./urls";
export { Url };
export { config } from "./config";

export { SearchInput } from "./messages/searchInput";

import { route as Route } from "./urls";
export { Route };

export { SimpleResponse } from "./api";
