import React from 'react';
import './Topbar.css';
import { ReactComponent as Mail } from "./icons/topbar/Mail_16x.svg";
import { ReactComponent as Message } from "./icons/topbar/Message_16x.svg";
import { ReactComponent as Search } from "./icons/topbar/Search_16x.svg";
import { ReactComponent as UserProfile } from "./icons/topbar/UserProfile_16x.svg";
import { NavLink } from 'react-router-dom';

export function Topbar() {
  return (
    <div className="topbar" >
      <div className="container">
        <ul className="icons">
          <li className="icon"><NavLink to="/index" title="Site Map"><Search viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
          <li className="icon"><NavLink to="/discussions" title="Discussions"><Message viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
          <li className="icon"><NavLink to="/users" title="Users"><UserProfile viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
          <li className="icon"><NavLink to="/index" title="Notifications"><Mail viewBox="0 0 16 16" width="20" height="20" /></NavLink></li>
          <li className="text"><NavLink to="/login" className="login">Join this community</NavLink></li>
        </ul>
      </div>
    </div>
  );
}
