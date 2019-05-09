import React from 'react';
import { renderContents, Contents } from './PageLayout';
import * as I from "../data";
import * as IO from "../io";
import { ErrorMessage } from "./ErrorMessage";
import { AppContext, AppContextProps } from './AppContext';

export const Login: React.FunctionComponent = () => {

  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
  const appContext: AppContextProps = React.useContext(AppContext);

  const inputUserName = React.createRef<HTMLInputElement>();
  const inputPassword = React.createRef<HTMLInputElement>();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    const userName = inputUserName.current!.value;
    const password = inputPassword.current!.value;
    IO.login({ userName, password })
      .then((userSummary: I.UserSummary) => appContext.setMe(userSummary))
      .catch((error: Error) => setErrorMessage(error.message));
    event.preventDefault();
  };

  const main = (
    <React.Fragment>
      <p>This will be a login page, with user name and password.</p>
      <p>For this prototype, just press the button to simulate a login.</p>
      <form onSubmit={handleSubmit}>
        <p><input type="text" ref={inputUserName} placeholder="Username" /></p>
        <p><input type="text" ref={inputPassword} placeholder="Password" /></p>
        <p><input type="submit" value="Submit" /></p>
        <ErrorMessage errorMessage={errorMessage} />
      </form>
      <h3>Only in this prototype</h3>
      <p>The UI details for creating a new account are not defined yet.</p>
      <p>If you refresh the page, then this application is reloaded and:</p>
      <ul>
        <li>The login is reset</li>
        <li>Any other data you entered is reset</li>
      </ul>
      <p>This is a prototype of the UI, without a server: so any data you enter isn't permanently stored anywhere.</p>
    </React.Fragment>
  );
  const contents: Contents = { main };
  return renderContents({ title: "Login", contents });
}

