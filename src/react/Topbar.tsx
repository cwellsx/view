import React from 'react';
import { NavLink } from 'react-router-dom';
import './Topbar.css';
import * as Icon from "../icons";
import { route } from "../shared/request";
import { AppContext, AppContextProps } from './AppContext';
import { getUserSummary } from "./Components";

export const Topbar: React.FunctionComponent = () => {
  const appContext: AppContextProps = React.useContext(AppContext);

  return (
    <div className="topbar" >
      <div className="container">
        <ul className="icons">
          <li className="icon"><NavLink to={route.siteMap} title="Site Map">
            <Icon.Search width="24" height="24" /></NavLink></li>
          {appContext.me ?
            (
              <React.Fragment>
                <li className="icon"><NavLink to={route.discussions} title="Discussions">
                  <Icon.Message width="24" height="24" /></NavLink></li>
                <li className="icon"><NavLink to={route.users} title="Users">
                  <Icon.UserProfile width="24" height="24" /></NavLink></li>
                <li className="icon"><NavLink to="/index" title="Notifications">
                  <Icon.Mail width="24" height="24" /></NavLink></li>
                <li className="icon">{getUserSummary(appContext.me, { title: true, size: "small" }).gravatar}</li>
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
