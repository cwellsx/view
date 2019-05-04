import { IdName } from "./Id";

export interface UserSummary {
  idName: IdName,
  gravatarHash: string,
  location?: string
}
