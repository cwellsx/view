import React, { useEffect } from 'react';
import 'pagedown-editor/sample-bundle';
import 'pagedown-editor/pagedown.css';
import './Editor.css';
import * as IO from '../io';
import * as I from '../data';
import { EditorTags, OutputTags } from './EditorTags';
import * as R from "../shared/urls";
import { History } from "history";
import { config } from "../config";
import {
  ValidatedState, createValidated, Input, createInitialState, useReducer, useReducer0,
  ValidatedEditorProps, Validated
} from "./ErrorMessage";
import * as Post from "../shared/post";

const minLengths = {
  title: 15,
  body: 30
}

/*
  There's no README in the https://github.com/StackExchange/pagedown repo
  but there's one made for it at https://github.com/mmillican/pagedown which is
  copied from https://code.google.com/archive/p/pagedown/wikis/PageDown.wiki
*/

/*
  Edit Tag Info
*/

interface EditTagInfoProps {
  history: History,
  tag: string,
  summary?: string,
  markdown?: string
};
export const EditTagInfo: React.FunctionComponent<EditTagInfoProps> = (props: EditTagInfoProps) => {

  type T = Post.EditTagInfo;

  const { min: minLength, max: maxLength } = I.tagSummaryLength;

  function initialState(initialData: EditTagInfoProps): ValidatedState<T> {
    const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
      ["summary", {
        label: "Summary",
        options: { minLength },
        create: { type: "textarea", placeholder: "", attributes: { rows: 7, maxLength } }
      }],
      ["markdown", {
        label: "Description",
        options: { optional: true },
        create: { type: "editor", editor: Editor }
      }],
    ]);
    // reuse the default values for the initial state
    const { summary, markdown } = initialData;
    const state: T = { summary: summary ? summary : "", markdown: markdown ? markdown : "" };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer<T, EditTagInfoProps>(props, (x: EditTagInfoProps) => initialState(x));

  function getSummaryHint(): string {
    const count: number = maxLength - state.posted.summary.length;
    return `${count} characters left`
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size) {
      // error messages are already displayed
      return;
    }
    // post edited profile to the server
    IO.editTagInfo(props.tag, state.posted)
      .then((tag: I.Key) => {
        // construct the URL of the newly-edited user
        const url = R.getTagInfoUrl(tag);
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        props.history.push(url);
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  };

  // created the validated elements and the submit button
  const buttonText = { label: "Save Edits", noun: "post" };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

  return (
    <form className="editor tag-wiki" onSubmit={handleSubmit}>
      <div className="element">
        {mapInputs.get("summary")}
        <p className="hint">(plain text only, no Markdown formatting)</p>
        <p className="hint next">{getSummaryHint()}</p>
      </div>
      <div className="element">
        {mapInputs.get("markdown")}
      </div>
      <div className="element">
        {button}
      </div>
    </form>
  );
}

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

  type T = Post.EditUserProfile;

  function initialState(initialData: EditUserSettingsProps): ValidatedState<T> {
    const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
      ["name", {
        label: "Display name",
        options: {},
        create: { type: "input", placeholder: "required", attributes: {} }
      }],
      ["location", {
        label: "Location (optional)",
        options: { optional: true },
        create: { type: "input", placeholder: "optional", attributes: {} }
      }],
      ["email", {
        label: "Email",
        options: {},
        create: { type: "input", placeholder: "required", attributes: {} }
      }],
      ["aboutMe", {
        label: "About me",
        options: { optional: true },
        create: { type: "editor", editor: Editor }
      }],
    ]);
    // reuse the default values for the initial state
    const { name, location, email, aboutMe } = initialData;
    const state: T = { name, location: location ? location : "", email, aboutMe: aboutMe ? aboutMe : "" };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer<T, EditUserSettingsProps>(props, (x: EditUserSettingsProps) => initialState(x));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size) {
      // error messages are already displayed
      return;
    }
    // post edited profile to the server
    IO.editUserProfile(props.userId, state.posted)
      .then((idName: I.IdName) => {
        // construct the URL of the newly-edited user
        const url = R.getUserUrl(idName);
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        props.history.push(url);
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  };

  // created the validated elements and the submit button
  const buttonText = { label: "Save Changes", noun: "changed settings" };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

  return (
    <form className="editor settings" onSubmit={handleSubmit}>
      <h1>Edit</h1>
      <h2>Public information</h2>
      <div className="public">
        {props.gravatar}
        <div className="column">
          {mapInputs.get("name")}
          {mapInputs.get("location")}
        </div>
      </div>
      {mapInputs.get("aboutMe")}
      <h2>Private settings</h2>
      {mapInputs.get("email")}
      <div className="submit">
        {button}
      </div>
    </form>
  );
}

/*
  AnswerDiscussion
*/

interface AnswerDiscussionProps { discussionId: number, reload: () => void };
export const AnswerDiscussion: React.FunctionComponent<AnswerDiscussionProps> = (props) => {

  type T = Post.NewMessage;

  function initialState(): ValidatedState<T> {
    const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
      ["markdown", {
        label: "Body",
        hideLabel: true,
        options: { minLength: minLengths.body },
        create: { type: "editor", editor: Editor }
      }],
    ]);
    // reuse the default values for the initial state
    const state: T = { markdown: "" };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer0<T>(() => initialState());

  const { discussionId, reload } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size) {
      // error messages are already displayed
      return;
    }
    IO.newMessage(discussionId, state.posted)
      .then((__message: I.Message) => {
        // could push the received message into the display
        // but instead let's force a reload e.g. to see whether any other user has posted too
        reload();
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  };

  // created the validated elements and the submit button
  const buttonText = { label: "Post Your Answer", noun: "answer" };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

  const form = (
    <form className="editor" onSubmit={handleSubmit}>
      <h2>Your Answer</h2>
      {mapInputs.get("markdown")}
      <div className="submit">
        {button}
      </div>
    </form>
  );

  return form;
}

/*
  NewDiscussionProps
*/

type NewDiscussionProps = { history: History }
export const NewDiscussion: React.FunctionComponent<NewDiscussionProps> = (props: NewDiscussionProps) => {

  type T = Post.NewDiscussion;

  function initialState(): ValidatedState<T> {
    const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
      ["title", {
        label: "Title",
        options: { minLength: minLengths.title },
        create: { type: "input", placeholder: "", attributes: {} }
      }],
      ["markdown", {
        label: "Body",
        options: { minLength: minLengths.body },
        create: { type: "editor", editor: Editor }
      }],
    ]);
    // reuse the default values for the initial state
    const state: T = { title: "", markdown: "", tags: [] };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer0<T>(() => initialState());
  // tags are handle separately ... the validation etc. in ErrorMessage.tsx is only for string elements
  // whereas tags are string[]
  const [outputTags, setOutputTags] = React.useState<OutputTags>({ tags: [], isValid: false });

  const { history } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size || !outputTags.isValid) {
      // error messages are already displayed
      return;
    }
    IO.newDiscussion({ ...state.posted, tags: outputTags.tags })
      .then((idName: I.IdName) => {
        // construct the URL of the newly-created discussion
        const url = R.getDiscussionUrl(idName);
        history.push(url);
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  };

  // created the validated elements and the submit button
  const buttonText = { label: config.strNewQuestion.button, noun: config.strNewQuestion.noun };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

  const emptyTags: string[] = [];
  const { minimum, maximum, canNewTag } = config.tagValidation;
  const form = (
    <form className="editor" onSubmit={handleSubmit}>
      <div className="element">
        {mapInputs.get("title")}
      </div>
      <div className="element">
        {mapInputs.get("markdown")}
      </div>
      <div className="element">
        <label htmlFor="tags">Tags</label>
        <EditorTags inputTags={emptyTags} result={setOutputTags} getAllTags={IO.getAllTags}
          minimum={minimum} maximum={maximum} canNewTag={canNewTag}
          showValidationError={state.onSubmit}
          hrefAllTags={R.route.tags} />
      </div>
      <div className="element">
        {button}
      </div>
    </form>
  );

  return form;
}

/*
  Editor
*/

const Editor = (props: ValidatedEditorProps) => {
  const { label, handleChange, defaultValue, errorMessage } = props;

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

  const validated = (
    <React.Fragment>
      <Validated errorMessage={errorMessage}>
        <textarea
          // ref={textareaRef}
          onChange={e => handleChange(e.target.value)}
          id="wmd-input"
          className="wmd-input"
          name={label.name}
          placeholder="Type markdown here"
          defaultValue={defaultValue}
        ></textarea>
      </Validated>
    </React.Fragment>
  );

  // these elements are copied from those in the "pagedown-editor/sample.html"
  return (
    <React.Fragment>
      {label.element}
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
          {validated}
        </div>
      </div>
    </React.Fragment>
  );
};
