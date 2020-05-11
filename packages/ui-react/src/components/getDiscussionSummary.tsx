import React from "react";
import { NavLink } from "react-router-dom";
import { Url, Data } from "client";
import { KeyedItem } from "../PageLayout";

import { toLocaleString } from "./toLocaleString";
import { getWhen } from "./getWhen";
import { getUserInfo } from "./getUserInfo";
import { getTags } from "./getTags";

export function getDiscussionSummary(summary: Data.DiscussionSummary, short: boolean = false): KeyedItem {
  const href = Url.getDiscussionUrl(summary);
  const when = toLocaleString(new Date(summary.messageSummary.dateTime));
  const stats = short ? undefined : (
    <div className="stats">
      <div className="answers">
        <strong>{summary.nAnswers}</strong> {summary.nAnswers === 1 ? "answer" : "answers"}
      </div>
    </div>
  );
  const signature = short ? (
    <div className="user-info">{getWhen(when)}</div>
  ) : (
    getUserInfo(summary.messageSummary.userSummary, "small", when)
  );
  const element: React.ReactElement = (
    <div className="discussion-summary">
      {stats}
      <div className="summary">
        <h3>
          <NavLink to={href}>{summary.name}</NavLink>
        </h3>
        <div className="excerpt">{summary.messageSummary.messageExerpt}</div>
        {getTags(summary.tags)}
        {signature}
      </div>
    </div>
  );
  return { element, key: href };
}