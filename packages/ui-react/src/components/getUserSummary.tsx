import React from "react";
import { NavLink } from "react-router-dom";
import { Url, Data } from "client";

export type GravatarSize = "small" | "big" | "huge";

export function getUserSummary(
  summary: Data.UserSummary,
  option: { title: boolean; size: GravatarSize }
): { userName: React.ReactElement; gravatar: React.ReactElement; key: string } {
  const href = Url.getUserUrl(summary);
  const userName = <NavLink to={href}>{summary.name}</NavLink>;
  const size = option.size === "small" ? 32 : option.size === "big" ? 48 : 164;
  // https://en.gravatar.com/site/implement/images/
  const src = `https://www.gravatar.com/avatar/${summary.gravatarHash}?s=${size * 2}&d=identicon&r=PG`;
  const img = <img src={src} alt={summary.name} width={size} height={size} />;
  const title = option.title ? summary.name : undefined;
  const gravatar = (
    <NavLink to={href} title={title} className="gravatar">
      {img}
    </NavLink>
  );
  return { userName, gravatar, key: href };
}
