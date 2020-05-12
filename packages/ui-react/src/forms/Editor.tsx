import React, { useEffect } from "react";
import "pagedown-editor/sample-bundle";
import "pagedown-editor/pagedown.css";
import "ui-assets/css/Editor.css";
import { Api, Data, Url, Post, config } from "client";
import { EditorTags, OutputTags } from "../EditorTags";
import { History } from "history";
import {
  ValidatedState,
  createValidated,
  Input,
  createInitialState,
  useReducer,
  useReducer0,
  ValidatedEditorProps,
  Validated,
} from "../ErrorMessage";

export const Editor = (props: ValidatedEditorProps) => {
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
          onChange={(e) => handleChange(e.target.value)}
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
            <div id="wmd-preview" className="wmd-preview"></div>
          </div>
          <div>
            <div id="wmd-button-bar"></div>
          </div>
          {validated}
        </div>
      </div>
    </React.Fragment>
  );
};
