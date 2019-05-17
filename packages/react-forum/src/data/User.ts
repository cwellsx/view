import { IdName } from "./Id";
import { TagId } from "./Tag";

/*
  Copied from my specs:

    Information | Visible to all subscribers? | Editable by the user?
    --- | --- | ---
    [User profile](#user-profile) | yes | yes
    [Preferences -- Favourites](#favourites) | yes | yes
    [Preferences -- User groups](#user-groups) | yes | yes
    [Preferences -- Notifications](#notifications) | no | yes
    [Preferences -- Email](#email) | no | yes
    [Resources](#resources) | no | yes
    [Statistics](#statistics) | yes | no
    [Activity](#activity-history) | yes | no
    [User status](#user-status) | yes | Administrator

*/

export interface UserSummary {
  idName: IdName;
  gravatarHash: string;
  location?: string;
}

export interface UserSummaryEx extends UserSummary {
  tags?: TagId[];
}

export interface UserProfile {
  location?: string;
  aboutMe?: string; // markdown
}

// elements are optional e.g. because they're not defined or because they're private
export interface UserPreferences {
  email: string;
  // notifications and groups are TBD
}

// to be implemented later
// export type UserStatus = "active" | "disabled"

export interface User {
  summary: UserSummary; // include idName, gravatarHash, location
  profile: UserProfile;
  // preferences is present or not present depending on whether this is another user's profile
  // in future could refine this into PublicPreference | PrivatePreferences if we want any preferences to be public
  preferences?: UserPreferences;
};
