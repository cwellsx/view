import React, { FunctionComponent, useState, useEffect } from 'react';
import { BrowserRouter, Switch, Route, RouteComponentProps } from 'react-router-dom';
import { renderContentOne, Content } from './Column';
import { Topbar } from './Topbar';
import { Login } from './Login';
import './App.css';
import * as I from "../data";
import * as IO from "../io";
import * as Summaries from "./Summaries";

const App: FunctionComponent = () => {
  // https://reacttraining.com/react-router/web/api/BrowserRouter
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const AppRoutes: FunctionComponent = () => {
  // https://reacttraining.com/react-router/web/api/Switch
  return (
    <React.Fragment>
      <Topbar />
      <Switch>
        <Route exact path="/login" component={Login} />
        <Route exact path="/index" component={SiteMap} />
        <Route exact path="/discussions" component={Discussions} />
        <Route exact path="/users" component={Users} />
        <Route component={NoMatch} />
      </Switch>
    </React.Fragment>
  );
}

export const SiteMap: FunctionComponent = () => {

  /*
    visitors can see:
    - image document[s]
    - (featured) articles
    - (text) sources

    and cannot see:
    - users
    - discussions
    - feaure reports
    - notable omissions
  */

  // fetch SiteMap data as described at https://reactjs.org/docs/hooks-faq.html#how-can-i-do-data-fetching-with-hooks
  // also https://www.carlrippon.com/typed-usestate-with-typescript/

  const [data, setData] = useState<I.SiteMap | undefined>(undefined);

  // dependencies are constant i.e. don't re-run this effect
  // const deps = [];
  useEffect(() => {
    IO.getSiteMap()
      .then((siteMap) => setData(siteMap));
  }, []);

  // TODO https://www.robinwieruch.de/react-hooks-fetch-data/#react-hooks-abort-data-fetching

  const contents: Content[] = [];

  if (data) {
    // render the images
    data.images.forEach(x => contents.push(Summaries.getImageSummary(x)));
  }

  return renderContentOne({ title: "Site Map", contents });
}

export const Discussions: FunctionComponent = () => {
  return (
    <React.Fragment>
      <h1>Discussions</h1>
      <p>This will display a list of discussions.</p>
    </React.Fragment>
  );
}

export const Users: FunctionComponent = () => {
  return (
    <React.Fragment>
      <h1>Users</h1>
      <p>This will display a list of users.</p>
    </React.Fragment>
  );
}

export const NoMatch: React.ComponentType<RouteComponentProps<any>> = (props: RouteComponentProps<any>) => {
  const pathname = props.location.pathname;
  return (
    <div>
      <h3>
        No page found for <code>{pathname}</code>
      </h3>
    </div>
  );
}

export default App;
