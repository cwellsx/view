import { config, Route } from "client";
import React from "react";
import * as ReactRouter from "react-router-dom";
import "ui-assets/css/App.css";
import { Topbar } from "./components";
import { AppContext, useCreateMe } from "./hooks";
import * as Page from "./routes";

/*
  This defines the App's routes
  and the context (like global data) which is available to any chld elements which it creates.
*/

const App: React.FunctionComponent = () => {
  // pass the identity of the logged-in user to subcomponents via AppContext, instead of explicitly as parameter
  const [me, setMe] = useCreateMe();

  document.title = `${config.appname}`;

  // plus https://reacttraining.com/react-router/web/api/BrowserRouter
  return (
    <AppContext.Provider value={{ me, setMe }}>
      <ReactRouter.BrowserRouter basename={process.env.PUBLIC_URL}>
        <AppRoutes />
      </ReactRouter.BrowserRouter>
    </AppContext.Provider>
  );
};

const AppRoutes: React.FunctionComponent = () => {
  // https://reacttraining.com/react-router/web/api/Switch
  return (
    <React.Fragment>
      <Topbar />
      <ReactRouter.Switch>
        <ReactRouter.Route exact path="/index" component={Page.SiteMap} />
        <ReactRouter.Route exact path="/" component={Page.Discussions} />
        <ReactRouter.Route exact path="/home" component={Page.Home} />
        <ReactRouter.Route exact path={Route.login} component={Page.Login} />
        <ReactRouter.Route exact path={Route.siteMap} component={Page.SiteMap} />
        <ReactRouter.Route exact path={Route.discussions} component={Page.Discussions} />
        <ReactRouter.Route exact path={Route.newDiscussion} component={Page.NewDiscussion} />
        <ReactRouter.Route exact path={Route.users} component={Page.Users} />
        <ReactRouter.Route exact path={Route.tags} component={Page.Tags} />
        <ReactRouter.Route path={Route.discussionsTagged} component={Page.Discussions} />
        <ReactRouter.Route path={Route.users} component={Page.User} />
        <ReactRouter.Route path={Route.images} component={Page.Image} />
        <ReactRouter.Route path={Route.discussions} component={Page.Discussion} />
        <ReactRouter.Route path={Route.tags} component={Page.Tag} />
        <ReactRouter.Route component={Page.NotFound} />
      </ReactRouter.Switch>
    </React.Fragment>
  );
};

export default App;
