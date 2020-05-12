import React, { useEffect } from "react";
import "pagedown-editor/sample-bundle";
import "pagedown-editor/pagedown.css";
import "ui-assets/css/Editor.css";
import { Api, Data, Url, Post, config } from "client";
import { EditorTags, OutputTags } from "../EditorTags";
import { History } from "history";
import { Editor } from "./Editor";
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

type NewDiscussionProps = { history: History };
export const NewDiscussion: React.FunctionComponent<NewDiscussionProps> = (props: NewDiscussionProps) => {
  type T = Post.NewDiscussion;

  function initialState(): ValidatedState<T> {
    const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
      [
        "title",
        {
          label: "Title",
          options: { minLength: config.minLengths.title },
          create: { type: "input", placeholder: "", attributes: {} },
        },
      ],
      [
        "markdown",
        {
          label: "Body",
          options: { minLength: config.minLengths.body },
          create: { type: "editor", editor: Editor },
        },
      ],
    ]);
    // reuse the default values for the initial state
    const state: T = { title: "", markdown: "", tags: [] };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer0<T>(() => initialState());
  // tags are handle separately ... the validation etc. in ErrorMessage.tsx is only for string elements
  // whereas tags are string[]
  const [outputTags, setOutputTags] = React.useState<OutputTags>({
    tags: [],
    isValid: false,
  });

  const { history } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size || !outputTags.isValid) {
      // error messages are already displayed
      return;
    }
    Api.newDiscussion({ ...state.posted, tags: outputTags.tags })
      .then((idName: Data.IdName) => {
        // construct the URL of the newly-created discussion
        const url = Url.getDiscussionUrl(idName);
        history.push(url);
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  }

  // created the validated elements and the submit button
  const buttonText = {
    label: config.strNewQuestion.button,
    noun: config.strNewQuestion.noun,
  };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

  const emptyTags: string[] = [];
  const { minimum, maximum, canNewTag } = config.tagValidation;
  const form = (
    <form className="editor" onSubmit={handleSubmit}>
      <div className="element">{mapInputs.get("title")}</div>
      <div className="element">{mapInputs.get("markdown")}</div>
      <div className="element">
        <label htmlFor="tags">Tags</label>
        <EditorTags
          inputTags={emptyTags}
          result={setOutputTags}
          getAllTags={Api.getAllTags}
          minimum={minimum}
          maximum={maximum}
          canNewTag={canNewTag}
          showValidationError={state.onSubmit}
          hrefAllTags={Url.route.tags}
        />
      </div>
      <div className="element">{button}</div>
    </form>
  );

  return form;
};
