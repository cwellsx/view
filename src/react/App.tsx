import React, { FunctionComponent } from 'react';
import { BrowserRouter, Switch, Route, RouteComponentProps } from 'react-router-dom';
import { Topbar } from './Topbar';
import { renderContentOne, Content } from './Column';
import './App.css';

const App: React.FC = () => {
  // https://reacttraining.com/react-router/web/api/BrowserRouter
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const AppRoutes: React.FC = () => {
  // https://reacttraining.com/react-router/web/api/Switch
  return (
    <React.Fragment>
      <Topbar />
      <Switch>
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
  // 

  const contents: Content[]=[];
  contents.push(
    {
      element: <p>This will display the site map.</p>,
      key: "foo"
    }
    
  );
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
