import { Data } from "client/src";
import React from "react";
import "ui-assets/css/EditorTags.css";
import { useSelectTags } from "../hooks";
// this is to display a little 'x' SVG -- a Close icon which is displayed on each tag -- clicking it will delete the tag
// also to display a little '(!)' SVG -- an Error icon which is displayed in the element, if there's a validation error
import * as Icon from "../icons";
// this simply displays red text if non-empty text is passed to its errorMessage property
import { ErrorMessage } from "./ErrorMessage";
import { getOnSelectTags, log, ParentCallback, RenderedElement, Validation } from "./SelectTagsState";

type TagCount = Data.TagCount;

// this defines the properties which you pass to the EditorTags functional component
interface EditorTagsProps extends Validation {
  // the input/original tags to be edited (or an empty array if there are none)
  inputTags: string[];
  // the results are pushed back to the parent via this callback
  result: ParentCallback;
  // a function to fetch all existing tags from the server (for tag dictionary lookup)
  getAllTags: () => Promise<TagCount[]>;
}

export const EditorTags: React.FunctionComponent<EditorTagsProps> = (props) => {
  const { inputTags, result, getAllTags } = props;
  // get the state
  const { state, dispatch, tagDictionary, assert, errorMessage } = useSelectTags(inputTags, getAllTags, props);
  // get the event handlers
  const { onEditorClick, onDeleteTag, onTagClick, onChange, onKeyDown, onHintResult } = getOnSelectTags(
    assert,
    props,
    result,
    dispatch,
    state,
    tagDictionary
  );

  /*
    inputRef (data which is used by some of the event handlers)
  */

  const inputRef = React.createRef<HTMLInputElement>();

  /*
    Event handlers (which dispatch to the reducer)
  */

  function handleEditorClick(e: React.MouseEvent) {
    const isDiv = (e.target as HTMLElement).tagName === "DIV";
    if (!isDiv) {
      // this wasn't a click on the <div> itself, presumably instead a click on something inside the div
      return;
    }
    onEditorClick(inputRef.current!);
  }

  function handleDeleteTag(index: number, e: React.MouseEvent) {
    onDeleteTag(index, inputRef.current!);
    e.preventDefault();
  }

  function handleTagClick(index: number, e: React.MouseEvent) {
    onTagClick(index, inputRef.current!);
    e.preventDefault();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (onKeyDown(e.target as HTMLInputElement, e.key, e.shiftKey)) {
      e.preventDefault();
    }
  }

  function handleHintResult(outputTag: string) {
    onHintResult(inputRef.current!, outputTag);
  }

  /*
    Tag is a FunctionComponent to render each tag
  */

  interface TagProps {
    text: string;
    index: number;
    isValid: boolean;
  }
  const Tag: React.FunctionComponent<TagProps> = (props) => {
    const { text, index, isValid } = props;
    // https://reactjs.org/docs/handling-events.html#passing-arguments-to-event-handlers
    // eslint-disable-next-line
    const close = (
      <a onClick={(e) => handleDeleteTag(index, e)} title="Remove tag">
        <Icon.Close height="12" />
      </a>
    );
    const className = isValid ? "tag" : "tag invalid";
    return (
      <span className={className} onClick={(e) => handleTagClick(index, e)}>
        {text}
        {close}
      </span>
    );
  };

  /*
    The return statement which yields the JSX.Element from this function component
  */

  function showValidationResult() {
    const showError = props.showValidationError && !!state.validationError.length;
    if (!showError) {
      return {
        className: "tag-editor",
        icon: undefined,
        validationError: undefined,
      };
    }
    const className = "tag-editor invalid validated";
    const icon = <Icon.Error className="error" />;
    const validationErrorMessage = state.validationError;
    // use <a href={}> instead of <Link to={}> -- https://github.com/ReactTraining/react-router/issues/6344
    const suffix =
      validationErrorMessage[validationErrorMessage.length - 1] !== ";" ? undefined : (
        <React.Fragment>
          {"see a list of "}
          <a href={props.hrefAllTags} target="_blank" rel="noopener noreferrer">
            popular tags
          </a>
          {"."}
        </React.Fragment>
      );
    const validationError = (
      <p className="error">
        {validationErrorMessage} {suffix}
      </p>
    );
    return { validationError, icon, className };
  }
  const { validationError, icon, className } = showValidationResult();

  function getElement(element: RenderedElement, index: number): React.ReactElement {
    const isValid = !props.showValidationError || element.isValid;
    return element.type === "tag" ? (
      <Tag text={element.word} index={index} key={index} isValid={isValid} />
    ) : (
      <input
        type="text"
        key="input"
        ref={inputRef}
        className={isValid ? undefined : "invalid"}
        width={10}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onFocus={(e) => handleFocus(e, true)}
        onBlur={(e) => handleFocus(e, false)}
      />
    );
  }

  return (
    <div id="tag-both">
      <div className={className} onClickCapture={handleEditorClick}>
        {state.elements.map(getElement)}
        {icon}
      </div>
      <ShowHints hints={state.hints} inputValue={state.inputValue} result={handleHintResult} />
      <ErrorMessage errorMessage={errorMessage} />
      {validationError}
    </div>
  );
};

/*

  ShowHints

*/

interface ShowHintsProps {
  // hints (from dictionary)
  hints: TagCount[];
  // the current value of the tag in the editor
  inputValue: string;
  // callback of tag selected from list of hints if user clicks on it
  result: (outputTag: string) => void;
}
const ShowHints: React.FunctionComponent<ShowHintsProps> = (props) => {
  const { hints, inputValue, result } = props;
  if (!inputValue.length) {
    return <div className="tag-hints hidden"></div>;
  }
  return (
    <div className="tag-hints">
      {!hints.length
        ? "No results found."
        : hints.map((hint) => <ShowHint hint={hint} inputValue={inputValue} result={result} key={hint.key} />)}
    </div>
  );
};

interface ShowHintProps {
  // hints (from dictionary)
  hint: TagCount;
  // the current value of the tag in the editor
  inputValue: string;
  // callback of tag selected from list of hints if user clicks on it
  result: (outputTag: string) => void;
}
const ShowHint: React.FunctionComponent<ShowHintProps> = (props) => {
  const { hint, inputValue, result } = props;

  function getTag(key: string) {
    const index = key.indexOf(inputValue);
    return (
      <span className="tag">
        {index === -1 ? (
          key
        ) : (
          <React.Fragment>
            {key.substring(0, index)}
            <span className="match">{inputValue}</span>
            {key.substring(index + inputValue.length)}
          </React.Fragment>
        )}
      </span>
    );
  }
  // the key with the matched letters highlighted
  const tag = getTag(hint.key);
  // count the number of times this tag is used elsewhere, if any
  const count = hint.count ? <span className="multiplier">×&nbsp;{hint.count}</span> : undefined;
  // the summary, if any
  const summary = hint.summary ? <p>{hint.summary}</p> : undefined;
  // a link to more info i.e. the page which defines this tag
  function getMore(key: string) {
    const icon = <Icon.Info width="16" height="16" />;
    // we use <a> here instead of <Link> because this link will open a whole new tab, i.e. another instance of this SPA
    // in future I think it would be better to reimplement this as a split screen (two-column) view
    const anchor = (
      <a href={`/tags/${key}/info`} target="_blank" rel="noopener noreferrer">
        {icon}
      </a>
    );
    return <p className="more-info">{anchor}</p>;
  }
  const more = getMore(hint.key);
  return (
    <div
      className="hint"
      tabIndex={0}
      key={hint.key}
      onClick={(e) => result(hint.key)}
      onKeyDown={(e) => {
        if (e.key === "Enter") result(hint.key);
        e.preventDefault();
      }}
      onFocus={(e) => handleFocus(e, true)}
      onBlur={(e) => handleFocus(e, false)}
    >
      {tag}
      {count}
      {summary}
      {more}
    </div>
  );
};

// see [Simulating `:focus-within`](./EDITORTAGS.md#simulating-focus-within)
function handleFocus(e: React.FocusEvent<HTMLElement>, hasFocus: boolean) {
  function isElement(related: EventTarget | HTMLElement): related is HTMLElement {
    return (related as HTMLElement).tagName !== undefined;
  }
  // read it
  const target = e.target;
  const relatedTarget = e.relatedTarget;
  // relatedTarget is of type EventTarget -- upcast from that to HTMLElement
  const related: HTMLElement | undefined = relatedTarget && isElement(relatedTarget) ? relatedTarget : undefined;
  // get the tagName and className of the element
  const relatedName = !relatedTarget ? "!target" : !related ? "!element" : related.tagName;
  const relatedClass = !related ? "" : related.className;
  // log it
  const activeElement = document.activeElement;
  const targetName = target.tagName;
  const activeElementName = activeElement ? activeElement.tagName : "!activeElement";
  log("handleFocus", {
    hasFocus,
    targetName,
    activeElementName,
    relatedName,
    relatedClass,
  });
  // calculate it
  hasFocus = hasFocus || relatedClass === "hint";
  // write the result
  const div = document.getElementById("tag-both")!;
  if (hasFocus) {
    div.className = "focussed";
  } else {
    div.className = "";
  }
}
