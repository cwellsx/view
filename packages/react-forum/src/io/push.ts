export type Type = "Message" | "Discussion";

export interface Notification {
  type: Type;
  data: object; // TODO tighten this to Message | Discussion
}
