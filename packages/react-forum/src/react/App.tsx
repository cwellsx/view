import React from 'react';
import * as ReactRouter from 'react-router-dom';
import { renderContentOne, Content, Contents } from './Column';
import { Topbar } from './Topbar';
import { Login } from './Login';
import './App.css';
import * as I from "../data";
import * as IO from "../io";
import * as Page from "./Pages";
import * as Summaries from "./Summaries";
import { route, PageId, getPageId } from "../io/pageId";
import { AppContext } from './AppContext';
import { config } from "../config"
import { loginUser } from "../io/mock";

const App: React.FunctionComponent = () => {
  // https://fettblog.eu/typescript-react/context/ and
  // https://reactjs.org/docs/context.html#updating-context-from-a-nested-component
  const autologin = config.autologin ? loginUser : undefined;
  const [me, setMe] = React.useState<I.UserSummary | undefined>(autologin);

  document.title = `${config.appname}`;

  // plus https://reacttraining.com/react-router/web/api/BrowserRouter
  return (
    <AppContext.Provider value={{ me, setMe }}>
      <ReactRouter.BrowserRouter>
        <AppRoutes />
      </ReactRouter.BrowserRouter>
    </AppContext.Provider>
  );
}

const AppRoutes: React.FunctionComponent = () => {
  // https://reacttraining.com/react-router/web/api/Switch
  return (
    <React.Fragment>
      <Topbar />
      <ReactRouter.Switch>
        <ReactRouter.Route exact path="/index" component={SiteMap} />
        <ReactRouter.Route exact path={route.login} component={Login} />
        <ReactRouter.Route exact path={route.siteMap} component={SiteMap} />
        <ReactRouter.Route exact path={route.discussions} component={Discussions} />
        <ReactRouter.Route exact path={route.users} component={Users} />
        <ReactRouter.Route path={route.users} component={User} />
        <ReactRouter.Route component={NoMatch} />
      </ReactRouter.Switch>
    </React.Fragment>
  );
}
type RouteComponentProps = ReactRouter.RouteComponentProps<any>;

/*
  This is a "high-order component", which separates "getting data" from "presenting data".

  https://reactjs.org/docs/higher-order-components.html
  https://reactjs.org/docs/hooks-custom.html
*/

interface UseGetDataPropsT<T> {
  title: string,
  getData: () => Promise<T>,
  showData: (data: T) => Contents
}
function useGetDataT<T>(props: UseGetDataPropsT<T>): React.ReactElement {

  // fetch SiteMap data as described at https://reactjs.org/docs/hooks-faq.html#how-can-i-do-data-fetching-with-hooks
  // also https://www.carlrippon.com/typed-usestate-with-typescript/

  const [data, setData] = React.useState<T | undefined>(undefined);

  React.useEffect(() => {
    props.getData()
      .then((fetched) => setData(fetched));
  }, []); // [] implies the dependencies are constant i.e. don't re-run this effect

  // TODO https://www.robinwieruch.de/react-hooks-fetch-data/#react-hooks-abort-data-fetching

  const contents: Contents = (data)
    ? props.showData(data) // render the data
    : []; // else no data yet to render

  return renderContentOne({ title: "Site Map", contents });
}

export const SiteMap: React.FunctionComponent = () => {

  return useGetDataT<I.SiteMap>({
    title: "Site Map",
    getData: () => IO.getSiteMap(),
    showData: Page.SiteMap
  });
}

export const Discussions: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <h1>Discussions</h1>
      <p>This will display a list of discussions.</p>
    </React.Fragment>
  );
}

export const Users: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <h1>Users</h1>
      <p>This will display a list of users.</p>
    </React.Fragment>
  );
}

export const User: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const pathname = props.location.pathname;
  const pageId: PageId | undefined = getPageId(pathname);
  if (!pageId) {
    return NoMatch(props);
  }
  if (!pageId.id) {
    return NoMatch(props);
  }
  if (Array.isArray(pageId.id)) {
    return NoMatch(props);
  }
  const userId: number = pageId.id.id;
  return (
    <React.Fragment>
      <h1>Users</h1>
      <p>This will display one user -- the profile for user number {userId}.</p>
    </React.Fragment>
  );
}

export const NoMatch: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const pathname = props.location.pathname;
  return (
    <div>
      <h3>Not Found</h3>
      <p>No page found for <code>{pathname}</code></p>
    </div>
  );
}

export default App;
