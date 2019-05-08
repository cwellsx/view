import React from 'react';
import { NavLink } from 'react-router-dom';
import './Topbar.css';
import { ReactComponent as Mail } from "./icons/topbar/Mail_16x.svg";
import { ReactComponent as Message } from "./icons/topbar/Message_16x.svg";
import { ReactComponent as Search } from "./icons/topbar/Search_16x.svg";
import { ReactComponent as UserProfile } from "./icons/topbar/UserProfile_16x.svg";
import { route } from "../io/pageId";
import { AppContext, AppContextProps } from './AppContext';
import { getUserSummary } from "./Summaries";

export const Topbar: React.FunctionComponent = () => {
  const appContext: AppContextProps = React.useContext(AppContext);

  return (
    <div className="topbar" >
      <div className="container">
        <ul className="icons">
          <li className="icon"><NavLink to={route.siteMap} title="Site Map"><Search viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
          {appContext.me ?
            (
              <React.Fragment>
                <li className="icon"><NavLink to={route.discussions} title="Discussions"><Message viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
                <li className="icon"><NavLink to={route.users} title="Users"><UserProfile viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
                <li className="icon"><NavLink to="/index" title="Notifications"><Mail viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
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
