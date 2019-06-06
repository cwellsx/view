import React, { useEffect } from 'react';
import 'pagedown-editor/sample-bundle';
import 'pagedown-editor/pagedown.css';
import './Editor.css';
import * as IO from '../io';
import * as I from '../data';
import { ErrorMessage } from './ErrorMessage';
import { EditorTags } from './EditorTags';
import * as R from "../shared/request";
import { History } from "history";

/*
  There's no README in the https://github.com/StackExchange/pagedown repo
  but there's one made for it at https://github.com/mmillican/pagedown which is
  copied from https://code.google.com/archive/p/pagedown/wikis/PageDown.wiki
*/

/*
  EditUserSettings
*/

// this is a separate function component instead of just being incide the getSettingsContent function 
// [because it contains hooks](https://reactjs.org/docs/hooks-rules.html#only-call-hooks-from-react-functions)
interface EditUserSettingsProps {
  history: History,
  name: string,
  location?: string,
  aboutMe?: string,
  email: string,
  userId: number,
  gravatar: React.ReactElement
};
export const EditUserSettings: React.FunctionComponent<EditUserSettingsProps> = (props: EditUserSettingsProps) => {
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

  const inputDisplayName = React.createRef<HTMLInputElement>();
  const inputEmail = React.createRef<HTMLInputElement>();
  const inputLocation = React.createRef<HTMLInputElement>();
  const inputAbout = React.createRef<HTMLTextAreaElement>();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    const name = inputDisplayName.current!.value;
    const location = inputLocation.current!.value;
    const aboutMe = inputAbout.current!.value;
    const email = inputEmail.current!.value;
    event.preventDefault();
    IO.editUserProfile(props.userId, { name, location, aboutMe, email })
      .then((idName: I.IdName) => {
        // construct the URL of the newly-created discussion
        const url = R.getResourceUrl({ resourceType: "User", what: idName });
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        props.history.push(url);
      })
      .catch((error: Error) => setErrorMessage(error.message));
  };

  // the CSS for this is shared with other .user-profile tabs and is defined in ./Pages.css instead of in ./Editor.css
  return (
    <div className="user-profile settings">
      <h1>Edit</h1>
      <form className="editor" onSubmit={handleSubmit}>
        <h2>Public information</h2>
        <div className="public">
          {props.gravatar}
          <div className="column">
            <label>Display name</label>
            <input type="text" ref={inputDisplayName} placeholder="required" defaultValue={props.name} />
            <label>Location (optional)</label>
            <input type="text" ref={inputLocation} placeholder="optional" defaultValue={props.location} />
          </div>
        </div>
        <label>About me</label>
        <Editor textareaRef={inputAbout} defaultValue={props.aboutMe} />
        <h2>Private settings</h2>
        <label>Email</label>
        <input type="text" ref={inputEmail} placeholder="required" defaultValue={props.email} />
        <div className="submit">
          <input type="submit" value="Save Changes" />
          <ErrorMessage errorMessage={errorMessage} />
        </div>
      </form>
    </div>
  );
}

/*
  AnswerDiscussion
*/

interface AnswerDiscussionProps { discussionId: number, reload: () => void };
export const AnswerDiscussion: React.FunctionComponent<AnswerDiscussionProps> = (props) => {

  // The code here is similar to the code in NewDiscussion and could be refactored, e.g. moved
  // into the Editor component which they both share, but I think that abstracting handleSubmit
  // and errorMessage across a component boundary would just make it harder to read.

  const textareaRef = React.createRef<HTMLTextAreaElement>();
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

  const { discussionId, reload } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    const markdown = textareaRef.current!.value;
    event.preventDefault();
    IO.newMessage(discussionId, { markdown })
      .then((message: I.Message) => {
        // could push the received message into the display
        // but instead let's force a reload e.g. to see whether any other user has posted too
        reload();
      })
      .catch((error: Error) => setErrorMessage(error.message));
  };

  const form = (
    <form className="editor" onSubmit={handleSubmit}>
      <h2>Your Answer</h2>
      <Editor textareaRef={textareaRef} />
      <p><input type="submit" value="Post Your Answer" /></p>
      <ErrorMessage errorMessage={errorMessage} />
    </form>
  );

  return form;
}

/*
  NewDiscussionProps
*/

type NewDiscussionProps = { history: History }
export const NewDiscussion: React.FunctionComponent<NewDiscussionProps> = (props: NewDiscussionProps) => {
  const textareaRef = React.createRef<HTMLTextAreaElement>();
  const titleRef = React.createRef<HTMLInputElement>();
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
  const [tags, setTags] = React.useState<string[]>([]);
  const { history } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    const markdown = textareaRef.current!.value;
    const title = titleRef.current!.value;
    event.preventDefault();
    IO.newDiscussion({ title, markdown, tags })
      .then((idName: I.IdName) => {
        // construct the URL of the newly-created discussion
        const url = R.getResourceUrl({ resourceType: "Discussion", what: idName });
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        history.push(url);
      })
      .catch((error: Error) => setErrorMessage(error.message));
  };

  const emptyTags: string[] = [];

  const form = (
    <form className="editor" onSubmit={handleSubmit}>
      <div className="element">
        <label htmlFor="title">Title</label>
        <input type="text" name="title" ref={titleRef} placeholder="Title" />
      </div>
      <div className="element">
        <label htmlFor="text">Body</label>
        <Editor textareaRef={textareaRef} />
      </div>
      <div className="element">
        <label htmlFor="tags">Tags</label>
        <EditorTags inputTags={emptyTags} result={setTags} getAllTags={IO.getAllTags} />
      </div>
      <div className="element">
        <input type="submit" value="Post Your Answer" />
        <ErrorMessage errorMessage={errorMessage} />
      </div>
    </form>
  );

  return form;
}

/*
  Editor
*/

interface EditorProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  defaultValue?: string
};
export const Editor: React.FunctionComponent<EditorProps> = (props) => {
  const { textareaRef, defaultValue } = props;

  // calling reload() will force a re-render, so useEffect will run again, but if getPagedownEditor().run() is called
  // more than once then bad things happen e.g. there would be more than one editor toolbar
  const [once, setOnce] = React.useState<boolean>(false);

  // the original code embedded a <script> tag to run getPagedownEditor().run()
  // but if we do that then that will run before these React elements are rendered
  // so use the effect hook to specify somethng to be run after it's rendered
  useEffect(() => {
    // getPagedownEditor was added to the window object by the pagedown-editor/sample-bundle.js
    if (!once) {
      (window as any).getPagedownEditor().run();
      setOnce(true);
    }
  }, [once]);

  // these elements are copied from those in the "pagedown-editor/sample.html"
  return (
    <React.Fragment>
      <div className="container">
        <div className="wmd-panel">
          <div>
            <div id="wmd-preview" className="wmd-preview">
            </div>
          </div>
          <div>
            <div id="wmd-button-bar">
            </div>
          </div>
          <textarea
            ref={textareaRef}
            id="wmd-input"
            className="wmd-input"
            name="text"
            placeholder="Type markdown here"
            defaultValue={defaultValue}
          ></textarea>
        </div>
      </div>
    </React.Fragment>
  );
};
