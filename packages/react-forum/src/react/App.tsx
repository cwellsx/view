import React from 'react';
import * as ReactRouter from 'react-router-dom';
import { useLayout, Layout, loadingContents } from './PageLayout';
import { Topbar } from './Topbar';
import { Login } from './Login';
import './App.css';
import * as I from "../data";
import * as IO from "../io";
import * as Page from "./Pages";
import * as R from "../shared/request";
import { AppContext, AppContextProps } from './AppContext';
import { config } from "../config"
import { loginUser } from "../io/mock";
import { ErrorMessage } from "./ErrorMessage";
import { NewDiscussion as NewDiscussionElement } from "./Editor";
import { History } from "history";

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
        <ReactRouter.Route exact path={R.route.login} component={Login} />
        <ReactRouter.Route exact path={R.route.siteMap} component={SiteMap} />
        <ReactRouter.Route exact path={R.route.discussions} component={Discussions} />
        <ReactRouter.Route exact path={R.route.newDiscussion} component={NewDiscussion} />
        <ReactRouter.Route exact path={R.route.users} component={Users} />
        <ReactRouter.Route path={R.route.users} component={User} />
        <ReactRouter.Route path={R.route.images} component={Image} />
        <ReactRouter.Route path={R.route.discussions} component={Discussion} />
        <ReactRouter.Route component={NoMatch} />
      </ReactRouter.Switch>
    </React.Fragment>
  );
}

type RouteComponentProps = ReactRouter.RouteComponentProps<any>;

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

  ---
  
  Fetching data is as described at:
  
  - https://reactjs.org/docs/hooks-faq.html#how-can-i-do-data-fetching-with-hooks
  - https://overreacted.io/a-complete-guide-to-useeffect/
  - https://www.robinwieruch.de/react-hooks-fetch-data

  And using a hook with TypeScript:

  - https://www.carlrippon.com/typed-usestate-with-typescript/

  The template supports a parameter of type TParam (which is optional and may be void/undefined).
  If specified then the parameter is passed to the getData function and to the getContents function.

  ---

  Also, as described here ...

  https://stackoverflow.com/questions/56096560/avoid-old-data-when-using-useeffect-to-fetch-data

  ... if the parameter value changes then there's a brief wndow before the useEffect hook is run.
  Therefore the param value is stored in state whenever the data value is stored,
  and the data value is discarded when it's associated param value doesn't match the current param value.

  The solution described here ...
  
  https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect

  ... i.e. to "wrap it into the useCallback Hook" was insufficient because it leaves a brief
  timing hole before the useEffect fires and the data is refetched.
*/

function useGetLayout<TData, TParam = void>(
  getData: (param: TParam) => Promise<TData>,
  getLayout: (data: TData, param: TParam, reload: () => void) => Layout,
  param: TParam)
  : React.ReactElement {

  const [prev, setParam] = React.useState<TParam | undefined>(undefined);
  const [data, setData] = React.useState<TData | undefined>(undefined);

  // we pass the reload function to the getLayout function so that it can force a reload e.g. after
  // posting a new message to the server. We force a reload because nothing has changed on the client --
  // not even the URL -- but we want to fecth/refresh the data from the server.
  // https://stackoverflow.com/questions/46240647/can-i-call-forceupdate-in-stateless-component
  const [toggle, setToggle] = React.useState<boolean>(true);
  function reload() {
    setToggle(!toggle); // toggle the state to force render
  }

  React.useEffect(() => {
    getData(param)
      .then((fetched) => {
        setData(fetched);
        setParam(param);
      });
  }, [getData, getLayout, param, toggle]);

  // TODO https://www.robinwieruch.de/react-hooks-fetch-data/#react-hooks-abort-data-fetching

  const layout: Layout = (data) && (prev === param)
    ? getLayout(data, param, reload) // render the data
    : loadingContents; // else no data yet to render

  return useLayout(layout);
}

// passed as param to useGetLayout when TParam is void
// or I could have implemented a copy-and-paste of useGetLayout without the TParam
const isVoid: void = (() => { })();

function useGet<TData, TParam>(getData: (param: TParam) => Promise<TData>, param: TParam): TData | undefined {

  const [prev, setParam] = React.useState<TParam | undefined>(undefined);
  const [data, setData] = React.useState<TData | undefined>(undefined);

  React.useEffect(() => {
    getData(param)
      .then((fetched) => {
        setData(fetched);
        setParam(param);
      });
  }, [getData, param]);

  if (prev !== param) {
    // the param used n the most recent useEffect and currently saved in state doesn't match the current/desired prop
    // so return undefined for now and wait until useEffect has a chance to run again.
    // https://stackoverflow.com/questions/56096560/avoid-old-data-when-using-useeffect-to-fetch-data
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

const SiteMap: React.FunctionComponent = () => {

  return useGetLayout<I.SiteMap>(
    IO.getSiteMap,
    Page.SiteMap,
    isVoid
  );
}

/*
  Image
*/

const Image: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {

  const parsed = R.getImageOptions(props.location);
  if (R.isParserError(parsed)) {
    return noMatch(props, parsed.error);
  }

  // see https://stackoverflow.com/questions/55990985/is-this-a-safe-way-to-avoid-did-you-accidentally-call-a-react-hook
  // I'm not sure whether or why it's necessary to instantiate it like `<ImageId />` instead
  // of calling it as a function like `ImageId({imageId: imageId})` but I do it anyway.
  // So far as I can tell from testing, what really matters is the array of dependencies passed to useEffects.
  return <ImageId imageId={parsed.image.id} />;
}

interface ImageIdProps { imageId: number };
const ImageId: React.FunctionComponent<ImageIdProps> = (props: ImageIdProps) => {

  // https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect

  return useGetLayout<I.Image, number>(
    IO.getImage,
    Page.Image,
    props.imageId
  );
}

/*
  Users
*/

const Users: React.FunctionComponent = () => {
  return useGetLayout<I.UserSummaryEx[]>(
    IO.getUsers,
    Page.Users,
    isVoid
  );
}

/*
  User (with 2 or 3 different tabs)
*/

const User: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const appContext: AppContextProps = React.useContext(AppContext);
  const parsed = R.getUserOptions(props.location);
  if (R.isParserError(parsed)) {
    return noMatch(props, parsed.error);
  }
  const { user, userTabType } = parsed;
  const userId = user.id;
  const isActivity: boolean = userTabType === "Activity";
  const canEdit: boolean = appContext.me ? (appContext.me.id === userId) : false;
  if (!canEdit && (userTabType === "EditSettings")) {
    return noMatch(props, "You cannot edit another user's profile");
  }
  if (!isActivity) {
    return <UserProfile userId={userId} userTabType={userTabType} canEdit={canEdit} history={props.history} />;
  }
  // UserActivity may have extra search options, same as for Discussions, which the profile tab doesn't have
  const options = R.getUserActivityOptions(props.location);
  if (R.isParserError(options)) {
    return noMatch(props, options.error);
  }
  return <UserActivity user={options.user} userTabType={options.userTabType} sort={options.sort} page={options.page}
    canEdit={canEdit} />
}

interface UserProfileProps { userId: number, userTabType: R.UserTabType, canEdit: boolean, history: History };
const UserProfile: React.FunctionComponent<UserProfileProps> = (props: UserProfileProps) => {

  const { userId, userTabType, canEdit, history } = props;

  // we want to do something different here -- 
  // i.e. we want reuse the data from the call to IO.getUser,
  // even if the userTabType changes between "Profile" and "EditSettings"
  // if we used useGetLayout then we ought to specify (e.g. via useCallback) that userTabType is a dependency, so
  // instead we use `useGet` and invoke the "get layout" from here i.e. outside the function which contains useEffect.

  const data: I.User | undefined = useGet(IO.getUser, userId);
  const layout = (!data) ? loadingContents : Page.User({ data, userTabType, history }, canEdit, userId);
  return useLayout(layout);
}

type UserActivityProps = R.UserActivityOptions & { canEdit: boolean };
const UserActivity: React.FunctionComponent<UserActivityProps> = (props: UserActivityProps) => {

  const { user, userTabType, canEdit } = props;
  const { sort, page } = props;

  const options: R.UserActivityOptions = React.useMemo(
    () => { return { user: { id: user.id, name: user.name }, userTabType, sort, page }; },
    [user.id, user.name, userTabType, sort, page])

  // we want to do something a bit different here too --
  // i.e. we want to pass the canEdit value to the Page.User function
  // so that it knows whether to display the "Edit Settings" tab as an option
  // even though canEdit is not a parameter passed to the IO.getUserActivity function
  // so again we use `useGet` here instead of `useGetLayout` to better control how we invoke the "get layout" function
  const data: I.UserActivity | undefined = useGet(IO.getUserActivity, options);
  const layout = (!data) ? loadingContents : Page.User(data, canEdit, user.id);
  return useLayout(layout);
}

/*
  Discussions
*/

const Discussions: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  // get the options
  const options = R.getDiscussionsOptions(props.location);
  if (R.isParserError(options)) {
    return noMatch(props, options.error);
  }
  // split options into its components instead of passing whole options
  // otherwise the eslint "react-hooks/exhaustive-deps" rule wil complain when we use useMemo
  return <DiscussionsList sort={options.sort} pagesize={options.pagesize} page={options.page} />;
}

const DiscussionsList: React.FunctionComponent<R.DiscussionsOptions> = (props: R.DiscussionsOptions) => {

  const { sort, pagesize, page } = props;
  const options: R.DiscussionsOptions = React.useMemo(
    () => { return { sort, pagesize, page }; },
    [sort, pagesize, page])

  return useGetLayout<I.Discussions, R.DiscussionsOptions>(
    IO.getDiscussions,
    Page.Discussions,
    options
  );
}

/*
  Discussion (id)
*/

const Discussion: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {

  const parsed = R.getDiscussionOptions(props.location);
  if (R.isParserError(parsed)) {
    return noMatch(props, parsed.error);
  }

  return <DiscussionId discussion={parsed.discussion} sort={parsed.sort} page={parsed.page} />;
}

const DiscussionId: React.FunctionComponent<R.DiscussionOptions> = (props: R.DiscussionOptions) => {

  const { sort, discussion, page } = props;
  const options: R.DiscussionOptions = React.useMemo(
    () => { return { sort, page, discussion: { id: discussion.id, name: discussion.name } }; },
    [sort, discussion.id, discussion.name, page])

  return useGetLayout<I.Discussion, R.DiscussionOptions>(
    IO.getDiscussion,
    Page.Discussion,
    options
  );
}

/*
  Discussion (new)
*/

const NewDiscussion: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {

  // this is unusual because we don't need to fetch data before rendering this element
  const content = <NewDiscussionElement history={props.history} />;
  const title = config.strNewQuestion;
  const layout: Layout = {
    main: { content, title },
    width: "None"
  };
  return useLayout(layout);
}

/*
NoMatch
*/

const NoMatch: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  return noMatch(props);
}

function noMatch(props: RouteComponentProps, error?: string) {
  const pathname = props.location.pathname;
  return (
    <div>
      <h3>Not Found</h3>
      <p>No page found for <code>{pathname}</code></p>
      <ErrorMessage errorMessage={error} />
    </div>
  );
}

export default App;
