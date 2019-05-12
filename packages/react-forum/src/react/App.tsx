import React from 'react';
import * as ReactRouter from 'react-router-dom';
import { renderLayout, Layout, loadingContents } from './PageLayout';
import { Topbar } from './Topbar';
import { Login } from './Login';
import './App.css';
import * as I from "../data";
import * as IO from "../io";
import * as Page from "./Pages";
import { route, splitPath, splitPathUser, isNumber, PageType, UserPageType } from "../io/pageId";
import { AppContext, AppContextProps } from './AppContext';
import { config } from "../config"
import { loginUser } from "../io/mock";

/*
  This defines the App's routes
  and the context (like global data) which is available to any chld elements which it creates.
*/

const App: React.FunctionComponent = () => {
  // https://fettblog.eu/typescript-react/context/ and
  // https://reactjs.org/docs/context.html#updating-context-from-a-nested-component
  const autologin = config.autologin ? loginUser() : undefined;
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
        <ReactRouter.Route path={route.images} component={Image} />
        <ReactRouter.Route component={NoMatch} />
      </ReactRouter.Switch>
    </React.Fragment>
  );
}


type RouteComponentProps = ReactRouter.RouteComponentProps<any>;

function getId(props: RouteComponentProps, pageType: PageType): number | undefined {
  const pathname = props.location.pathname;
  const split = splitPath(pathname, pageType);
  const first = split[0];
  return (!isNumber(first)) ? undefined : first;
}

/*
  This is a "high-order component", a "custom hook" -- it separates "getting" the data from "presenting" the data.

  - https://reactjs.org/docs/higher-order-components.html
  - https://reactjs.org/docs/hooks-custom.html

  The sequence of events is:

  1. Called for the first time
  2. Calls hard-coded renderLayout(title, loadingContents)
  3. useEffect fires and:
     - Call getData to fetch data from the server
     - Call getContents to render the data into a Layout instance
     - Call renderLayout again to show the calculated Layout elements
  
  The renderLayout method support different page layouts --
  e.g. narrow text, full-screen images, a grid, and with optional extra columns.

  To support this it's convenient to make a single hard-coded call to renderLayout in any case,
  but to declare its input parameter type (i.e. the Layout interface) to be flexible/expressive,
  so that the getContents (i.e. one of the Page functions) can define arbitrarily complex content and layout.

  - getContents defines the contents of the page by creating a Layout instance which contains elements
  - renderLayout defines the page's columns within which the elements in the Layout are rendered
  
  Fetching data is as described at:
  
  - https://reactjs.org/docs/hooks-faq.html#how-can-i-do-data-fetching-with-hooks
  - https://overreacted.io/a-complete-guide-to-useeffect/
  - https://www.robinwieruch.de/react-hooks-fetch-data

  And using a hook with TypeScript:

  - https://www.carlrippon.com/typed-usestate-with-typescript/
*/

function useGetLayout<TData>(
  title: string,
  getData: () => Promise<TData>,
  getContents: (data: TData) => Layout): React.ReactElement {

  const [data, setData] = React.useState<TData | undefined>(undefined);

  React.useEffect(() => {
    getData()
      .then((fetched) => setData(fetched));
  }, [title, getData, getContents]);

  // TODO https://www.robinwieruch.de/react-hooks-fetch-data/#react-hooks-abort-data-fetching

  const layout: Layout = (data)
    ? getContents(data) // render the data
    : loadingContents; // else no data yet to render

  return renderLayout(title, layout);
}

function useGet2<TData, TParam>(getData: () => Promise<TData>, param: TParam): TData | undefined {

  const [prev, setPrev] = React.useState<TParam | undefined>(undefined);
  const [data, setData] = React.useState<TData | undefined>(undefined);

  React.useEffect(() => {
    getData()
      .then((fetched) => setData(fetched));
  }, [getData, param]);

  if (prev !== param) {
    // https://stackoverflow.com/questions/56096560/avoid-old-data-when-using-useeffect-to-fetch-data
    setPrev(param);
    setData(undefined);
    return undefined;
  }

  // TODO https://www.robinwieruch.de/react-hooks-fetch-data/#react-hooks-abort-data-fetching

  return data;
}

/*
  These are page definitions, which have a similar basic structure:

  - Invoked as a route from AppRoutes
  - Delegate to useGetLayout

  There's a different function for each "route" -- i.e. for each type of URL -- i.e. each type of page data and layout.
*/

export const SiteMap: React.FunctionComponent = () => {

  return useGetLayout<I.SiteMap>(
    "Site Map",
    IO.getSiteMap,
    Page.SiteMap
  );
}

export const Image: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {

  const imageId: number | undefined = getId(props, "Image");
  if (!imageId) {
    return NoMatch(props);
  }

  // see https://stackoverflow.com/questions/55990985/is-this-a-safe-way-to-avoid-did-you-accidentally-call-a-react-hook-after-an-ear
  // I'm not sure whether or why it's necessary to instantiate it like `<ImageId />`
  // instead of calling it as a function like `ImageId({imageId: imageId})` but I do it anyway.
  // So far as I can tell frm testing what really matters is the array of dependencies passed to useEffects.
  return <ImageId imageId={imageId} />;
}

interface ImageIdProps { imageId: number };
export const ImageId: React.FunctionComponent<ImageIdProps> = (props: ImageIdProps) => {

  // https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect
  const getImage = React.useCallback(() => IO.getImage(props.imageId), [props.imageId]);

  return useGetLayout<I.Image>(
    "Image",
    getImage,
    Page.Image
  );
}

export const Users: React.FunctionComponent = () => {
  return useGetLayout<I.UserSummaryEx[]>(
    "Users",
    IO.getUsers,
    Page.Users
  );
}

export const User: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const appContext: AppContextProps = React.useContext(AppContext);
  try {
    const { userId, userPageType } = splitPathUser(props.location.pathname, props.location.search);
    const isActivity: boolean = userPageType === "Activity";
    const canEdit: boolean = appContext.me ? (appContext.me.idName.id === userId) : false;
    if (!canEdit && (userPageType === "EditSettings")) {
      return NoMatch(props);
    }
    return isActivity
      ? <UserActivity userId={userId} canEdit={canEdit} />
      : <UserProfile userId={userId} userPageType={userPageType} canEdit={canEdit} />;
  } catch (e) {
    console.error(e.message);
    return NoMatch(props);
  }
}

interface UserActivityProps { userId: number, canEdit: boolean };
export const UserActivity: React.FunctionComponent<UserActivityProps> = (props: UserActivityProps) => {

  const { userId, canEdit } = props;
  const getUser = React.useCallback(() => IO.getUser(userId), [userId]);
  const showUser = React.useCallback((data: I.User) => Page.User(data, "Activity", canEdit), [canEdit]);

  return useGetLayout<I.User>(
    "User",
    getUser,
    showUser
  );
}

interface UserProfileProps { userId: number, userPageType: UserPageType, canEdit: boolean };
export const UserProfile: React.FunctionComponent<UserProfileProps> = (props: UserProfileProps) => {

  const { userId, userPageType, canEdit } = props;
  const getUser = React.useCallback(() => IO.getUser(userId), [userId]);

  // we want to do something different here -- 
  // i.e. want reuse the data from the call to IO.getUser,
  // even if the userPageType changes between "Profile" and "EditSettings"
  // if we used useGetLayout then we ought to specify (e.g. via useCallback) that userPageType is a dependency, so
  // instead we use `useGet` and invoke the "get layout" from here i.e. outside the function which contains useEffect.

  // const data: I.User | undefined = useGet(getUser);
  const data: I.User | undefined = useGet2(getUser, userId);
  const layout = (!data) ? loadingContents : Page.User(data, userPageType, canEdit);
  return renderLayout("User", layout);
}

export const Discussions: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <h1>Discussions</h1>
      <p>This will display a list of discussions.</p>
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
