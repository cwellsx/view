import React, { useEffect } from 'react';
import 'pagedown-editor/sample-bundle';
import 'pagedown-editor/pagedown.css';
import './Editor.css';
import * as IO from '../io';
import * as I from '../data';
import { ErrorMessage } from './ErrorMessage';

/*
  There's no README in the https://github.com/StackExchange/pagedown repo
  but there's one made for it at https://github.com/mmillican/pagedown which is
  copied from https://code.google.com/archive/p/pagedown/wikis/PageDown.wiki
*/

interface AnswerDiscussionProps { discussionId: number, reload: () => void };
export const AnswerDiscussion: React.FunctionComponent<AnswerDiscussionProps> = (props) => {

  const textareaRef = React.createRef<HTMLTextAreaElement>();

  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

  const { discussionId, reload } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    const markdown = textareaRef.current!.value;
    console.log(markdown);
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

interface EditorProps { textareaRef: React.RefObject<HTMLTextAreaElement> };
export const Editor: React.FunctionComponent<EditorProps> = (props) => {
  const { textareaRef } = props;

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
          ></textarea>
        </div>
      </div>
    </React.Fragment>
  );
};

