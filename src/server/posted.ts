import { BareMessage } from "./bare";

/*
  These are the types of data posted y users which may be stored on disk.
  They're a "discriminated union" of types so they can be easily reloaded.

  See also:
  
  - "../shared/post" which defines these types on the wire between client and server.
  - "./bare" which defines the data on disk after it's aggregated into a collection.
*/

export interface NewMessage {
  kind: "NewMessage",
  discussionId: number,
  message: BareMessage
}

export type Any = NewMessage;
