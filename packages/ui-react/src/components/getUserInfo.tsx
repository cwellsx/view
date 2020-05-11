import React, { ReactElement } from "react";
import { Data } from "client";

import { GravatarSize, getUserSummary } from "./getUserSummary";
import { getWhen } from "./getWhen";

export function getUserInfo(summary: Data.UserSummary, size: GravatarSize, when?: string): ReactElement {
  const { userName, gravatar, key } = getUserSummary(summary, {
    title: false,
    size,
  });
  const showWhen = !when ? undefined : getWhen(when);
  return (
    <div className="user-info" key={key}>
      {showWhen}
      {gravatar}
      <div className="details">
        {userName}
        {summary.location ? <span className="user-location">{summary.location}</span> : undefined}
      </div>
    </div>
  );
}
