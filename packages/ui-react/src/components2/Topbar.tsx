import React from "react";
import { NavLink } from "react-router-dom";
import "ui-assets/css/Topbar.css";
import * as Icon from "../icons";
import { Route, config } from "client";
import { useMe } from "../hooks";
import { getUserSummary } from "../Components";

export const Topbar: React.FunctionComponent = () => {
  const me = useMe();
  function showNotifications(e: React.MouseEvent) {
    alert("To do: this can be the user's inbox where notifications are displayed");
    e.preventDefault();
  }
  return (
    <div className="topbar">
      <div className="container">
        <ul className="icons">
          <li className="icon">
            <NavLink to="/home" title="About">
              <Icon.Home width="24" height="24" />
            </NavLink>
          </li>
          <li className="icon">
            <NavLink to={Route.tags} title={config.strTags}>
              <Icon.Search width="24" height="24" />
            </NavLink>
          </li>
          {me ? (
            <React.Fragment>
              <li className="icon">
                <NavLink to={Route.discussions} title={config.strQuestions}>
                  <Icon.Message width="24" height="24" />
                </NavLink>
              </li>
              <li className="icon">
                <NavLink to={Route.users} title="Users">
                  <Icon.UserProfile width="24" height="24" />
                </NavLink>
              </li>
              <li className="icon">
                <NavLink to="/index" title="Notifications" onClick={showNotifications}>
                  <Icon.Mail width="24" height="24" />
                </NavLink>
              </li>
              <li className="icon">{getUserSummary(me, { title: true, size: "small" }).gravatar}</li>
            </React.Fragment>
          ) : (
            <li className="text">
              <NavLink to={Route.login} className="login">
                Join this community
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
