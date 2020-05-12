import { Api, config, Data, Post, Url } from "client";
import { History } from "history";
import "pagedown-editor/pagedown.css";
import "pagedown-editor/sample-bundle";
import React from "react";
import "ui-assets/css/Editor.css";
import { EditorTags, OutputTags } from "../EditorTags";
import { Input, useValidatedInput } from "../hooks";
import { Editor } from "./Editor";

type NewDiscussionProps = { history: History };
export const NewDiscussion: React.FunctionComponent<NewDiscussionProps> = (props: NewDiscussionProps) => {
  type T = Post.NewDiscussion;

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
  const initialState: T = { title: "", markdown: "", tags: [] };
  const buttonText = {
    label: config.strNewQuestion.button,
    noun: config.strNewQuestion.noun,
  };
  const { currentState, isError, isAfterSubmit, button, mapInputs, onSubmitError } = useValidatedInput<T>(
    inputs,
    initialState,
    buttonText
  );

  // tags are handle separately ... the validation etc. in ErrorMessage.tsx is only for string elements
  // whereas tags are string[]
  const [outputTags, setOutputTags] = React.useState<OutputTags>({
    tags: [],
    isValid: false,
  });

  const { history } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isError || !outputTags.isValid) {
      // error messages are already displayed
      return;
    }
    Api.newDiscussion({ ...currentState, tags: outputTags.tags })
      .then((idName: Data.IdName) => {
        // construct the URL of the newly-created discussion
        const url = Url.getDiscussionUrl(idName);
        history.push(url);
      })
      .catch(onSubmitError);
  }

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
          showValidationError={isAfterSubmit}
          hrefAllTags={Url.route.tags}
        />
      </div>
      <div className="element">{button}</div>
    </form>
  );

  return form;
};
