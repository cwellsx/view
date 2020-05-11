import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Url, Data, config } from "client";

export function getDiscussionsSubtitle(
  title: string,
  left: string,
  tag: Data.Key | undefined,
  sort: Url.DiscussionsSort | "info"
) {
  const info = !tag ? undefined : <NavLink to={Url.getTagInfoUrl(tag)}>Info</NavLink>;
  const links =
    !tag || sort === "info" ? undefined : (
      <div className="minigrid links">
        <ul>
          <li>
            <Link to={Url.getTagInfoUrl(tag)}>Learn more…</Link>
          </li>
          <li>
            <Link to={Url.getTagEditUrl(tag)}>Improve tag info</Link>
          </li>
        </ul>
      </div>
    );

  return (
    <React.Fragment>
      <div className="minigrid">
        <h1>{title}</h1>
        <div className="link">
          <Link to={Url.route.newDiscussion} className="linkbutton">
            {config.strNewQuestion.button}
          </Link>
        </div>
      </div>
      {links}
      <div className="minigrid subtitle">
        <div className="count">{left}</div>
        <div className="sort">
          {info}
          <NavLink
            to={Url.getDiscussionsOptionsUrl({ sort: "Newest", tag })}
            className={sort === "Newest" ? "selected" : undefined}
          >
            Newest
          </NavLink>
          <NavLink
            to={Url.getDiscussionsOptionsUrl({ sort: "Active", tag })}
            className={sort === "Active" ? "selected" : undefined}
          >
            Active
          </NavLink>
        </div>
      </div>
    </React.Fragment>
  );
}
