import React from 'react';
import * as ReactRouter from 'react-router-dom';
import { useLayout, Layout, loadingContents } from './PageLayout';
import { Topbar } from './Topbar';
import { Login } from './Login';
import './App.css';
import * as I from "../data";
import * as IO from "../io";
import * as Page from "./Pages";
import * as R from "../shared/urls";
import { AppContext, useMe } from './AppContext';
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
        <ReactRouter.Route exact path={R.route.tags} component={Tags} />
        <ReactRouter.Route path={R.route.discussionsTagged} component={Discussions} />
        <ReactRouter.Route path={R.route.users} component={User} />
        <ReactRouter.Route path={R.route.images} component={Image} />
        <ReactRouter.Route path={R.route.discussions} component={Discussion} />
        <ReactRouter.Route path={R.route.tags} component={Tag} />
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
  2. Returns hard-coded `renderLayout(loadingContents)` which displays a "Loading..." message
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

// this gets data from the server
type IoGetDataT<TData, TParam> = (param: TParam) => Promise<TData>;

// this uses data from the server, and optional extra data, to create a Layout object
type Reload = () => void;
type GetLayoutT<TData, TExtra> = (data: TData, extra: TExtra & { reload: Reload }) => Layout;

// this value is passed as param to useGetLayout when TParam is void
// or I could have implemented a copy-and-paste of useGetLayout without the TParam
const isVoid: void = (() => { })();

// 1st overload, used when TParam is void
function useGetLayout0<TData>(
  getData: IoGetDataT<TData, void>,
  getLayout: GetLayoutT<TData, {}>): React.ReactElement {
  return useGetLayout<TData, void>(getData, getLayout, isVoid);
}

// 2nd overload, used when TParam (passed to the IO function) is significant
function useGetLayout<TData, TParam>(
  getData: IoGetDataT<TData, TParam>,
  getLayout: GetLayoutT<TData, {}>,
  param: TParam): React.ReactElement {
  return useGetLayout2<TData, TParam, {}>(getData, getLayout, param, {});
}

// 3rd overload when there's TExtra parameter data to pass to the page layout function
function useGetLayout2<TData, TParam, TExtra extends {}>(
  getData: IoGetDataT<TData, TParam>,
  getLayout: GetLayoutT<TData, TExtra>,
  param: TParam,
  extra: TExtra)
  : React.ReactElement {

  const [prev, setParam] = React.useState<TParam | undefined>(undefined);
  const [data, setData] = React.useState<TData | undefined>(undefined);

  // we pass the reload function to the getLayout function so that it can force a reload e.g. after
  // posting a new message to the server. We force a reload because nothing has changed on the client --
  // not even the URL -- but we want to fetch/refresh the data from the server.
  // https://stackoverflow.com/questions/46240647/can-i-call-forceupdate-in-stateless-component
  const [toggle, setToggle] = React.useState<boolean>(true);
  function reload() {
    setToggle(!toggle); // toggle the state to force render
  }

  // add the reload function to the extra data which we pass as a parameter to the layout function
  // so that the layout function can call reload() if it wants to
  const extra2: TExtra & { reload: Reload } = { ...extra, reload };

  React.useEffect(() => {
    getData(param)
      .then((fetched) => {
        setData(fetched);
        setParam(param);
      });
  }, [getData, getLayout, param, toggle]);

  // TODO https://www.robinwieruch.de/react-hooks-fetch-data/#react-hooks-abort-data-fetching

  const layout: Layout = (data) && (prev === param)
    ? getLayout(data, extra2) // render the data
    : loadingContents; // else no data yet to render

  return useLayout(layout);
}

/*
  These are page definitions, which have a similar basic structure:

  - Invoked as a route from AppRoutes
  - Delegate to useGetLayout

  There's a different function for each "route" -- i.e. for each type of URL -- i.e. each type of page data and layout.
*/

const SiteMap: React.FunctionComponent = () => {

  return useGetLayout0<I.SiteMap>(
    IO.getSiteMap,
    Page.SiteMap
  );
}

/*
  Image
*/

const Image: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {

  const parsed = R.isImage(props.location);
  if (R.isParserError(parsed)) {
    return noMatch(props, parsed.error);
  }

  // see https://stackoverflow.com/questions/55990985/is-this-a-safe-way-to-avoid-did-you-accidentally-call-a-react-hook
  // I'm not sure whether or why it's necessary to instantiate it like `<ImageId />` instead
  // of calling it as a function like `ImageId({imageId: imageId})` but I do it anyway.
  // So far as I can tell from testing, what really matters is the array of dependencies passed to useEffects.
  return <ImageId id={parsed.id} name={parsed.name} />;
}

interface ImageIdProps { id: number, name: string };
const ImageId: React.FunctionComponent<ImageIdProps> = (props: ImageIdProps) => {

  // ImageId is a separate function component because there's an `if` statement at the top of the Image cmpnent
  // https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect

  const { id, name } = props;
  const idName = React.useMemo<I.IdName>(() => { return { id, name }; }, [id, name]);

  return useGetLayout<I.Image, I.IdName>(
    IO.getImage,
    Page.Image,
    idName
  );
}

/*
  Users
*/

const Users: React.FunctionComponent = () => {
  return useGetLayout0<I.UserSummaryEx[]>(
    IO.getUsers,
    Page.Users
  );
}

/*
  User (with 2 or 3 different tabs)
*/

const User: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const parsed = R.isUserOptions(props.location);
  const me = useMe();
  if (R.isParserError(parsed)) {
    return noMatch(props, parsed.error);
  }
  const { userTabType, user } = parsed;
  const canEdit = !!me && user.id === me.id;
  switch (userTabType) {
    case "Profile":
    case undefined:
      return <UserProfile {...props} id={user.id} name={user.name} canEdit={canEdit} />;
    case "EditSettings":
      if (!canEdit) {
        return noMatch(props, "You cannot edit another user's profile");
      }
      return <UserEditSettings {...props} id={user.id} name={user.name} canEdit={canEdit} />;
    case "Activity":
      const options = R.isUserActivityOptions(props.location);
      if (R.isParserError(options)) {
        return noMatch(props, options.error);
      }
      return <UserActivity {...props} options={options} canEdit={canEdit} />;
    default:
      return noMatch(props, "Unexpected userTabType");
  }
}

// these are used as TExtra types
type UserCanEdit = { canEdit: boolean };
type UserCanEditAndHistory = UserCanEdit & { history: History };

type UserProps = RouteComponentProps & I.IdName & UserCanEdit;
const UserProfile: React.FunctionComponent<UserProps> = (props: UserProps) => {
  const { id, name } = props;
  const idName = React.useMemo<I.IdName>(() => { return { id, name }; }, [id, name]);
  return useGetLayout2<I.User, I.IdName, UserCanEdit>(
    IO.getUser,
    Page.UserProfile,
    idName,
    { canEdit: props.canEdit }
  );
}

const UserEditSettings: React.FunctionComponent<UserProps> = (props: UserProps) => {
  const { id, name } = props;
  const idName = React.useMemo<I.IdName>(() => { return { id, name }; }, [id, name]);
  return useGetLayout2<I.User, I.IdName, UserCanEditAndHistory>(
    IO.getUser,
    Page.UserSettings,
    idName,
    { canEdit: props.canEdit, history: props.history }
  );
}

type UserActivityProps = RouteComponentProps & { options: R.UserActivityOptions } & UserCanEdit;
const UserActivity: React.FunctionComponent<UserActivityProps> = (props: UserActivityProps) => {
  // UserActivity may have extra search options, same as for Discussions, which the profile tab doesn't have
  const { user, userTabType, sort, page } = props.options;
  const { id, name } = user;
  const options = React.useMemo<R.UserActivityOptions>(
    () => { return { user: { id, name }, userTabType, sort, page }; }, [id, name, userTabType, sort, page]);
  return useGetLayout2<I.UserActivity, R.UserActivityOptions, UserCanEdit>(
    IO.getUserActivity,
    Page.UserActivity,
    options,
    { canEdit: props.canEdit }
  );
}

/*
  Discussions
*/

const Discussions: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  // get the options
  const options = R.isDiscussionsOptions(props.location);
  if (R.isParserError(options)) {
    return noMatch(props, options.error);
  }
  // split options into its components instead of passing whole options
  // otherwise the eslint "react-hooks/exhaustive-deps" rule wil complain when we use useMemo
  return <DiscussionsList sort={options.sort} pagesize={options.pagesize} page={options.page} tag={options.tag} />;
}

const DiscussionsList: React.FunctionComponent<R.DiscussionsOptions> = (props: R.DiscussionsOptions) => {

  const { sort, pagesize, page, tag } = props;
  const options: R.DiscussionsOptions = React.useMemo(
    () => { return { sort, pagesize, page, tag }; },
    [sort, pagesize, page, tag])

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

  const parsed = R.isDiscussionOptions(props.location);
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
  const title = config.strNewQuestion.title;
  const layout: Layout = {
    main: { content, title },
    width: "None"
  };
  return useLayout(layout);
}

/*
  Tags
*/

const Tags: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  // get the options
  const options = R.isTagsOptions(props.location);
  if (R.isParserError(options)) {
    return noMatch(props, options.error);
  }
  return <TagsList sort={options.sort} pagesize={options.pagesize} page={options.page} />;
}

const TagsList: React.FunctionComponent<R.TagsOptions> = (props: R.TagsOptions) => {

  const { sort, pagesize, page } = props;
  const options: R.TagsOptions = React.useMemo(
    () => { return { sort, pagesize, page }; },
    [sort, pagesize, page])

  return useGetLayout<I.Tags, R.TagsOptions>(
    IO.getTags,
    Page.Tags,
    options
  );
}

/*
  Tag (key)
*/

const Tag: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {

  const info = R.isTagInfo(props.location);
  if (!R.isParserError(info)) {
    return <TagId tag={info.key} word="info" history={props.history} />;
  }
  const edit = R.isTagEdit(props.location);
  if (!R.isParserError(edit)) {
    return <TagId tag={edit.key} word="edit" history={props.history} />;
  }
  return noMatch(props);

}

type TagIdProps = R.InfoOrEdit & { history: History, tag: string };
const TagId: React.FunctionComponent<TagIdProps> = (props: TagIdProps) => {

  const { tag, word, history } = props;

  // include word as a dependency because we want to re-render if word changes,
  // even though { word } isn't required in the TParam parameter passed to useGetLayout2
  const key: I.Key & R.InfoOrEdit = React.useMemo(
    () => { return { key: tag, word }; },
    [tag, word]);

  return useGetLayout2<I.TagInfo, I.Key, Page.TagExtra>(
    IO.getTag,
    Page.Tag,
    key,
    { word, history }
  );
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
