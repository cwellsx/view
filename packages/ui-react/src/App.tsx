import 'ui-assets/css/App.css';

import { Api, Cache, config, Route, Url } from 'client/src';
import React from 'react';
import * as ReactRouter from 'react-router-dom';

import * as AppRoute from './appRoutes';
import { Topbar } from './components';
import { AppContext, GetLink, GetNavLink, useCreateMe } from './hooks';

/*
  getLink and getNavLink are defined here so the rest of the application can avoid depending directly on React Router
  e.g. so that in future  there could be a different implementation of this project which depends on Next.js instead.
*/

const getLink: GetLink = (props) => {
  const { to, className, children } = props;
  return (
    <ReactRouter.Link to={to} className={className}>
      {children}
    </ReactRouter.Link>
  );
};

const getNavLink: GetNavLink = (props) => {
  const { to, className, title, onClick, children } = props;
  return (
    <ReactRouter.NavLink to={to} className={className} title={title} onClick={onClick}>
      {children}
    </ReactRouter.NavLink>
  );
};

/*
  This defines the App's routes
  and the context (like global data) which is available to any child elements which it creates.
*/

interface AppOptions {
  api: Api;
  cache?: Cache;
}

const App: React.FunctionComponent<AppOptions> = (appOptions: AppOptions) => {
  document.title = `${config.appname}`;

  // plus https://reacttraining.com/react-router/web/api/BrowserRouter
  return (
    <ReactRouter.BrowserRouter basename={process.env.PUBLIC_URL}>
      <AppRoutes api={appOptions.api} cache={appOptions.cache} />
    </ReactRouter.BrowserRouter>
  );
};

const AppRoutes: React.FunctionComponent<AppOptions> = (appOptions: AppOptions) => {
  // https://reacttraining.com/react-router/web/api/Switch
  const location = ReactRouter.useLocation();
  const [me, setMe] = useCreateMe();
  const history = ReactRouter.useHistory();
  const { api, cache } = appOptions;

  return (
    <AppContext.Provider value={{ me, setMe, api, cache, pushHistory: history.push, getLink, getNavLink }}>
      <React.Fragment>
        <Topbar />
        <ReactRouter.Switch>
          <ReactRouter.Route exact path={["/index", Route.siteMap]} component={AppRoute.SiteMap} />
          <ReactRouter.Route exact path={["/", Route.discussions, Route.discussionsTagged + "/:tag"]}>
            {(() => {
              // get the options
              const options = Url.isDiscussionsOptions(location);
              return Url.isParserError(options) ? (
                AppRoute.notFound(location.pathname, options.error)
              ) : (
                // split options into its components instead of passing whole options
                // otherwise the eslint "react-hooks/exhaustive-deps" rule wil complain when we use useMemo
                <AppRoute.Discussions
                  sort={options.sort}
                  pagesize={options.pagesize}
                  page={options.page}
                  tag={options.tag}
                />
              );
            })()}
          </ReactRouter.Route>
          <ReactRouter.Route exact path="/home" component={AppRoute.Home} />
          <ReactRouter.Route exact path={Route.login} component={AppRoute.Login} />
          <ReactRouter.Route exact path={Route.newDiscussion} component={AppRoute.NewDiscussion} />
          <ReactRouter.Route exact path={Route.users} component={AppRoute.Users} />
          <ReactRouter.Route exact path={Route.tags}>
            {(() => {
              const options = Url.isTagsOptions(location);
              return Url.isParserError(options) ? (
                AppRoute.notFound(location.pathname, options.error)
              ) : (
                <AppRoute.Tags sort={options.sort} pagesize={options.pagesize} page={options.page} />
              );
            })()}
          </ReactRouter.Route>
          <ReactRouter.Route path={Route.users}>
            {(() => {
              const parsed = Url.isUserOptions(location);
              if (Url.isParserError(parsed)) {
                return AppRoute.notFound(location.pathname, parsed.error);
              }
              const { userTabType, user } = parsed;
              const canEdit = !!me && user.id === me.id;
              switch (userTabType) {
                case "Profile":
                case undefined:
                  return <AppRoute.UserProfile id={user.id} name={user.name} canEdit={canEdit} />;
                case "EditSettings":
                  if (!canEdit) {
                    return AppRoute.notFound(location.pathname, "You cannot edit another user's profile");
                  }
                  return <AppRoute.UserEditSettings id={user.id} name={user.name} canEdit={canEdit} />;
                case "Activity":
                  const options = Url.isUserActivityOptions(location);
                  if (Url.isParserError(options)) {
                    return AppRoute.notFound(location.pathname, options.error);
                  }
                  return <AppRoute.UserActivity options={options} canEdit={canEdit} />;
                default:
                  return AppRoute.notFound(location.pathname, "Unexpected userTabType");
              }
            })()}
          </ReactRouter.Route>
          <ReactRouter.Route path={Route.images}>
            {(() => {
              const options = Url.isImage(location);
              return Url.isParserError(options) ? (
                AppRoute.notFound(location.pathname, options.error)
              ) : (
                <AppRoute.Image id={options.id} name={options.name} />
              );
            })()}
          </ReactRouter.Route>
          <ReactRouter.Route path={Route.discussions}>
            {(() => {
              const options = Url.isDiscussionOptions(location);
              return Url.isParserError(options) ? (
                AppRoute.notFound(location.pathname, options.error)
              ) : (
                <AppRoute.Discussion discussion={options.discussion} sort={options.sort} page={options.page} />
              );
            })()}
          </ReactRouter.Route>
          <ReactRouter.Route path={Route.tags}>
            {(() => {
              const info = Url.isTagInfo(location);
              if (!Url.isParserError(info)) {
                return <AppRoute.Tag tag={info.key} word="info" />;
              }
              const edit = Url.isTagEdit(location);
              if (!Url.isParserError(edit)) {
                return <AppRoute.Tag tag={edit.key} word="edit" />;
              }
              return AppRoute.notFound(location.pathname, edit.error);
            })()}
          </ReactRouter.Route>
          <ReactRouter.Route>return Page2.notFound(location.pathname);</ReactRouter.Route>
        </ReactRouter.Switch>
      </React.Fragment>
    </AppContext.Provider>
  );
};

export default App;
