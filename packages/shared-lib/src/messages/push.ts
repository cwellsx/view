/*
  Something like this could be implemented in future to push notifications from server to client
  but that's not presently implemented at all.
*/

export type Type = "Message" | "Discussion";

export interface Notification {
  type: Type;
  data: object; // TODO tighten this to Message | Discussion
}
