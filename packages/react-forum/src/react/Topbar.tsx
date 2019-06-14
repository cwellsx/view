import React from 'react';
import { NavLink } from 'react-router-dom';
import './Topbar.css';
import * as Icon from "../icons";
import { route } from "../shared/urls";
import { useMe } from './AppContext';
import { getUserSummary } from "./Components";
import { config } from '../config';

export const Topbar: React.FunctionComponent = () => {
  const me = useMe();
  function showNotifications(e: React.MouseEvent) {
    alert("To do: this can be the user's inbox where notifications are displayed");
    e.preventDefault();
  }
  return (
    <div className="topbar" >
      <div className="container">
        <ul className="icons">
          <li className="icon"><NavLink to={route.tags} title={config.strTags}>
            <Icon.Search width="24" height="24" /></NavLink></li>
          {me ?
            (
              <React.Fragment>
                <li className="icon"><NavLink to={route.discussions} title={config.strQuestions}>
                  <Icon.Message width="24" height="24" /></NavLink></li>
                <li className="icon"><NavLink to={route.users} title="Users">
                  <Icon.UserProfile width="24" height="24" /></NavLink></li>
                <li className="icon"><NavLink to="/index" title="Notifications" onClick={showNotifications}>
                  <Icon.Mail width="24" height="24" /></NavLink></li>
                <li className="icon">{getUserSummary(me, { title: true, size: "small" }).gravatar}</li>
              </React.Fragment>
            ) :
            (
              <li className="text"><NavLink to={route.login} className="login">Join this community</NavLink></li>
            )}
        </ul>
      </div>
    </div>
  );
}
