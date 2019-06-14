import React from 'react';
import './EditorTags.css';
// this is to display a little 'x' SVG -- a Close icon which is displayed on each tag -- clicking it will delete the tag
// also to display a little '(!)' SVG -- an Error icon which is displayed in the element, if there's a validation error
import * as Icon from "../icons";
// this simply displays red text if non-empty text is passed to its errorMessage property
import { ErrorMessage } from './ErrorMessage';

// these are the properties of an existing tag, used or displayed by the TagDictionary
interface TagCount {
  key: string,
  summary?: string,
  count: number
}

// these are properties to configurare the validation of tags
interface Validation {
  // whether a minimum number of tags must be defined, e.g. 1
  minimum: boolean,
  // whether a maximum number of tags must be defined, e.g. 5
  maximum: boolean,
  // whether the user can create new tags, or whether tags must match what's already in the dictionary
  canNewTag: boolean,
  // whether the show validation error messages -- they're hidden until the user first presses the form's submit button
  showValidationError: boolean,
  // the href used for the link to "popular tags" in the validation error message -- i.e. "/tags"
  hrefAllTags: string
}

// the results are pushed back to the parent via this callback
export interface OutputTags { tags: string[], isValid: boolean };
type ParentCallback = (outputTags: OutputTags) => void;

// this defines the properties which you pass to the EditorTags functional component
interface EditorTagsProps extends Validation {
  // the input/original tags to be edited (or an empty array if there are none)
  inputTags: string[],
  // the results are pushed back to the parent via this callback
  result: ParentCallback,
  // a function to fetch all existing tags from the server (for tag dictionary lookup)
  getAllTags: () => Promise<TagCount[]>
};

/*
  This source file is long and has the following sections -- see also [EditorTags](./EDITORTAGS.md)

  # Defined outside the React function component:

  - All the type definitions
    - Assert
    - ParentCallback
    - Context
    - State
    - RenderedElement
    - RenderedState
    - InputElement
    - InputState
    - MutableState
    - TagDictionary

  - The reducer
    - action types
    - reducer
  
  - Various helper functions
    - stringSplice
    - log and logRenderedState
    - getInputIndex
    - getElementStart and getWordStart
    - assertElements and assertWords
    - getTextWidth
    - handleFocus
  
  - Functions which construct the RenderedState
    - renderState
    - initialState
  
  # Defined inside the React function component:

  - React hooks
    - errorMessage
    - assert (a function which uses errorMessage and is required by initialState)
    - state 

  - inputRef (data which is used by some of the event handlers)

  - Event handlers (which dispatch to the reducer)
    - getContext
    - handleEditorClick
    - handleDeleteTag
    - handleTagClick
    - handleChange
    - handleKeyDown
    - handleHintResult

  - Tag is a FunctionComponent to render each tag

  - The return statement which yields the JSX.Element from this function component

  # Other function components to display the drop-down hints

  - ShowHints
  - ShowHint
*/

// you could temporarily change this to enable logging, for debugging
const isLogging = false;

/*
  All the type definitions
*/

type Assert = (assertion: boolean, message: string, extra?: () => object) => void;

// this is extra data which event handlers pass (as part of the action) from the function component to the reducer
interface Context {
  inputElement: InputElement;
  assert: Assert;
  result: ParentCallback;
  tagDictionary?: TagDictionary;
  validation: Validation;
};

// this is like the input data from which the RenderedState is calculated
// these and other state elements are readonly so that event handlers must mutate MutableState instead
interface State {
  // the selection range within the buffer
  // this may even span multiple words, in which case all the selected words are in the <input> element
  readonly selection: { readonly start: number, readonly end: number },
  // the words (i.e. the tags when this is split on whitespace)
  readonly buffer: string
};

// this interface identifies the array of <input> and <Tag> elements to be rendered, and the word associated with each
interface RenderedElement {
  // the string value of this word
  readonly word: string;
  // whether this word is rendered by a Tag element or by the one input element
  readonly type: "tag" | "input";
  // whether this word matches an existing tag in the dictionary
  readonly isValid: boolean;
};

// this interface combines the two states, and is what's stored using useReducer
interface RenderedState {
  // the buffer which contains the tag-words, and the selection within the buffer
  readonly state: State;
  // how that's rendered i.e. the <input> element plus <Tag> elements
  readonly elements: ReadonlyArray<RenderedElement>;
  // the current ("semi-controlled") value of the <input> element
  readonly inputValue: string;
  // the hints associated with the inputValue, taken from the TagDictionary
  hints: TagCount[];
  // the validation error message (zero length if there isn't one)
  validationError: string;
}

// this wraps the current state of the <input> control
class InputElement {
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly isDirectionBackward: boolean;
  readonly value: string;
  readonly isLeftTrimmed: boolean;
  private readonly inputElement: HTMLInputElement;

  constructor(inputElement: HTMLInputElement, assert: Assert, stateValue?: string) {

    let { selectionStart, selectionEnd, selectionDirection, value } = inputElement;
    log("getInput", { selectionStart, selectionEnd, selectionDirection, value });

    assert(!stateValue || stateValue === value, "stateValue !== value");

    // TypeScript declaration says these may be null, though I haven't seen that in practice?
    if (selectionStart === null) {
      assert(false, "unexpected null selectionStart");
      selectionStart = 0;
    }
    if (selectionEnd === null) {
      assert(false, "unexpected null selectionEnd");
      selectionEnd = 0;
    }
    if (selectionStart > selectionEnd) {
      assert(false, "unexpected selectionStart > selectionEnd");
      selectionStart = 0;
    }
    // left trim if the user entered leading spaces
    let isLeftTrimmed = false;
    while (value.length && value[0] === " ") {
      value = value.substring(1);
      --selectionStart;
      --selectionEnd;
      isLeftTrimmed = true;
    }

    this.selectionStart = selectionStart;
    this.selectionEnd = selectionEnd;
    this.isDirectionBackward = selectionDirection === "backward";
    this.value = value;
    this.isLeftTrimmed = isLeftTrimmed;
    this.inputElement = inputElement;
  }

  focus(): void {
    this.inputElement.focus();
  }

  setContent(value: string, start: number, end: number): void {
    // set the value before the selection, otherwise the selection might be invalid
    this.inputElement.value = value;
    this.inputElement.setSelectionRange(start, end);
    // dynammically readjust the width of the input element to match its content
    const width = getTextWidth(value + "0");
    this.inputElement.style.width = `${width}px`;
  }

  toJSON(): string {
    // JSON.stringify cannot handle `inputElement: HTMLInputElement` so the purpose of this is to exclude that
    const printable: string[] = [
      `start: ${this.selectionEnd}`,
      `end: ${this.selectionEnd}`,
      `backward: ${this.isDirectionBackward}`,
      `value: ${this.value}`
    ];
    return printable.join(", ");
  }
}

// this combines the state of the <input> control with the position of the <input> within the RenderedState
// it exists only to help the KeyDown event handlers determine whether keys like ArrowLeft will change the selected word
// beware that, when this runs, the <input> control's value may not yet have been written to the elements[editing].word
class InputState {
  readonly canMoveLeft: boolean;
  readonly canMoveRight: boolean;
  readonly currentStart: number;
  readonly currentEnd: number;
  get nextLeft(): number { return this.currentStart - 1; }
  get nextRight(): number { return this.currentEnd + 1; }

  constructor(state: RenderedState, inputElement: InputElement, assert: Assert) {
    const { elements } = state;
    const { inputIndex, isFirst, isLast } = getInputIndex(elements, assert);
    const elementStart = getElementStart(elements, inputIndex, assert);

    const { selectionStart, selectionEnd, isDirectionBackward, value } = inputElement;

    // if a range is selected then which end of the range is moving?
    const isLeftMoving = (selectionStart === selectionEnd) || isDirectionBackward;
    const isRightMoving = (selectionStart === selectionEnd) || !isDirectionBackward;

    // can move left if at the start of the <input> and if there are other <Tag> elements before the <input> element
    this.canMoveLeft = selectionStart === 0 && !isFirst && isLeftMoving;
    // can move right if at the end of the <input> and if there are other <Tag> elements after the <input> element
    this.canMoveRight = selectionEnd === value.length && !isLast && isRightMoving;

    this.currentStart = elementStart + selectionStart;
    this.currentEnd = elementStart + selectionEnd;
  }

  removeSelected(mutableState: MutableState): void {
    mutableState.remove(this.currentStart, this.currentEnd);
  }
}

// this is a class which event-handlers use to mutate the current state
// its methods are whatever primitive methods are required by the event handlers which use it
// it's contructed from the previous RenderedState, then mutated, and then eventually returns the new RenderedState
class MutableState {
  private selection: { start: number, end: number };
  private buffer: string;
  // store the elements as word because until the mutation stops we don't know which will be the input element
  // e.g. what's currently current input element may be deleted and/or the input may be moved to a different word
  private words: string[];
  private context: Context;

  constructor(renderedState: RenderedState, context: Context) {
    // load the data from the previous state into non-readonly elements
    const { state, elements } = renderedState;
    this.selection = state.selection;
    this.buffer = state.buffer;
    this.words = elements.map(x => x.word); // use concat with no parameters to convert from ReadonlyArray to []
    this.context = context;

    // stash the input -- i.e. update the buffered data to reflect whatever is currently in the <input> element
    const { inputIndex } = getInputIndex(elements, context.assert);
    const { value, selectionStart, selectionEnd } = context.inputElement;
    this.replaceElement(inputIndex, value, { start: selectionStart, end: selectionEnd });
    log("MutableState", { selection: this.selection, buffer: this.buffer, words: this.words });
  }

  // called when the event handler has finished mutating this MutableState
  getState(): RenderedState {
    const state: State = { buffer: this.buffer, selection: this.selection };
    const { assert, inputElement, tagDictionary, validation } = this.context;
    const renderedState: RenderedState = renderState(state, assert, validation, inputElement, tagDictionary);
    logRenderedState("MutableState.getState returning", renderedState);
    // do a callback to the parent to say what the current tags are (excluding the empty <input> word if there is one)
    const tags: string[] = renderedState.elements.map(element => element.word).filter(word => !!word.length);
    const isValid = !renderedState.validationError.length;
    this.context.result({ tags, isValid });
    return renderedState;
  }

  replaceElement(index: number, newValue: string, selection?: { start: number, end: number }): void {
    this.invariant();

    const editingWord: string = this.words[index];
    // a special case is when the input element is empty and the last word -- then it's beyond the end of the buffer
    const nWords = this.words.length - ((this.words[this.words.length - 1] === "") ? 1 : 0);

    // if the new word matches the existing word then the replace will do nothing
    if (editingWord === newValue) {
      return;
    }
    const wordStart = getWordStart(this.words, index, this.context.assert);

    // possibly insert or delete whitespace before or after the word being added or deleted

    // if we delete the whole word and this isn't the last word then also delete the space after this word
    const deleteSpaceAfter = newValue === "" && index < nWords - 1;
    if (deleteSpaceAfter) {
      this.assertSpaceAt(wordStart + editingWord.length);
    }
    // if we delete the last word then delete the space before it
    const deleteSpaceBefore = newValue === "" && index === nWords - 1 && index !== 0;
    if (deleteSpaceBefore) {
      this.assertSpaceAt(wordStart - 1);
    }
    // if we add another word beyond a previous word (i.e. beyond the end of the buffer) then insert the space before it
    const addSpaceBefore = (wordStart === this.atBufferEnd()) && index;
    if (addSpaceBefore) {
      // assert this word was previously empty and is being changed to non-empty
      this.context.assert(!editingWord.length && !!newValue.length, "unexpected at end of buffer");
    }

    log("replaceElement", { deleteSpaceAfter, deleteSpaceBefore, addSpaceBefore });
    // calculate the deleteCount, and adjust deleteCount and/or wordStart and/or newValue, to insert or delete spaces

    const deleteCount: number = editingWord.length + (deleteSpaceAfter || deleteSpaceBefore ? 1 : 0);
    const spliceStart: number = (deleteSpaceBefore || addSpaceBefore) ? wordStart - 1 : wordStart;
    const spliceValue: string = (!addSpaceBefore) ? newValue : " " + newValue;

    // mutate the buffer
    this.buffer = stringSplice(this.buffer, spliceStart, deleteCount, spliceValue);
    // mutate the word in the elements array
    if (newValue.length) {
      this.words[index] = newValue;
    } else {
      this.words.splice(index, 1);
    }

    // adjust the selected range after mutating the text
    if (selection) {
      // called from constructor where new selection is taken from the <input> element
      const wordStart = getWordStart(this.words, index, this.context.assert);
      this.selection.start = selection.start + wordStart;
      this.selection.end = selection.end + wordStart;
    } else {
      // called from onDeleteTag where existing selection must be adjusted to account for the deleted element
      if (this.selection.start > wordStart) {
        this.selection.start -= deleteCount;
      }
      if (this.selection.end > wordStart) {
        this.selection.end -= deleteCount;
      }
    }
    this.invariant();
  }

  private invariant() {
    // we mutate the state but because we make several mutations this asserts that the state remains sane or predictable
    assertWords(this.words, this.buffer, this.context.assert);
  }
  private assertSpaceAt(index: number) {
    this.context.assert(this.buffer.substring(index, index + 1) === " ", "expected a space at this location");
  }

  remove(start: number, deleteCount: number): void {
    this.buffer = stringSplice(this.buffer, start, deleteCount, "");
  }

  // the start and end of the selection range are usually the same
  setSelectionBoth(where: number): void {
    this.selection.start = where;
    this.selection.end = where;
  }
  setSelectionStart(where: number): void {
    this.selection.start = where;
  }
  setSelectionEnd(where: number): void {
    this.selection.end = where;
  }
  // the location of the selection index beyond the end of the buffer (starting the empty, to-be-defined next tag)
  atBufferEnd(): number {
    return (this.buffer.length) ? this.buffer.length + 1 : 0;
  }

  selectEndOf(index: number) {
    const wordStart = getWordStart(this.words, index, this.context.assert);
    this.setSelectionBoth(wordStart + this.words[index].length);
  }
  focus() {
    this.context.inputElement.focus();
  }
};

// we want to display a maximum of 6 hints
const maxHints = 6;

// this is a class to lookup hints for existing tags which match the current input value
class TagDictionary {
  // the current implementation repeatedly iterates the whole dictionary
  // if that's slow (because the dictionary is large) in future we could partition the dictionary by letter
  private readonly tags: TagCount[];
  constructor(tags: TagCount[]) {
    this.tags = tags;
  }
  getHints(inputValue: string, elements: RenderedElement[]): TagCount[] {
    if (!inputValue.length) {
      return [];
    }
    // don't want what we already have i.e. what matches other tags
    const unwanted: string[] = elements.filter(x => x.type === "tag").map(x => x.word);
    // we'll select tags in the following priority:
    // 1. Tags where the inputValue matches the beginning of the tag
    // 2. If #1 returns too many tags, then prefer tags with a higher count because they're the more popular/more likely
    // 3. If #1 doesn't return enough tags, then find tags where the inputValue matches within the tag
    // 4. If #3 returns too many tags, then prefer tags with a higher count
    const findTags = (start: boolean, max: number): TagCount[] => {
      const found = (this.tags.filter(tag => start
        ? tag.key.startsWith(inputValue)
        : tag.key.substring(1).includes(inputValue))).filter(x => !unwanted.includes(x.key));
      // higher counts first, else alphabetic
      found.sort((x, y) => (x.count === y.count) ? x.key.localeCompare(y.key) : y.count - x.count);
      return found.slice(0, max);
    }
    const found = findTags(true, maxHints);
    return (found.length === maxHints) ? found : found.concat(findTags(false, maxHints - found.length));
  }
  exists(inputValue: string): boolean {
    return this.tags.some(tag => tag.key === inputValue);
  }
  toJSON(): string {
    // not worth logging all the elements
    return `${this.tags.length} elements`;
  }
}

/*
  The reducer
*/

interface ActionEditorClick { type: "EditorClick", context: Context };
interface ActionHintResult { type: "HintResult", context: Context, hint: string, inputIndex: number };
interface ActionDeleteTag { type: "DeleteTag", context: Context, index: number };
interface ActionTagClick { type: "TagClick", context: Context, index: number };
interface ActionKeyDown { type: "KeyDown", context: Context, key: string, shiftKey: boolean };
interface ActionChange { type: "Change", context: Context };

type Action = ActionEditorClick | ActionHintResult | ActionDeleteTag | ActionTagClick | ActionKeyDown | ActionChange;

function isEditorClick(action: Action): action is ActionEditorClick { return action.type === "EditorClick"; }
function isHintResult(action: Action): action is ActionHintResult { return action.type === "HintResult"; }
function isDeleteTag(action: Action): action is ActionDeleteTag { return action.type === "DeleteTag"; }
function isTagClick(action: Action): action is ActionTagClick { return action.type === "TagClick"; }
function isKeyDown(action: Action): action is ActionKeyDown { return action.type === "KeyDown"; }
function isChange(action: Action): action is ActionChange { return action.type === "Change"; }

function reducer(state: RenderedState, action: Action): RenderedState {

  log("reducer", action);
  const inputElement = action.context.inputElement;

  // this function returns a MutableState instance, which is based on the previous state plus the passed-in context
  // the passed-in context includes the new content of the <input> element
  function getMutableState(): MutableState {
    logRenderedState("getMutableState", state);
    return new MutableState(state, action.context);
  }
  // this function returns a InputState instance
  function getInputState(): InputState {
    return new InputState(state, inputElement, action.context.assert);
  }

  if (isChange(action)) {
    const mutableState: MutableState = getMutableState();
    return mutableState.getState();
  }

  if (isEditorClick(action)) {
    // click on the <div> => set focus on the <input> within the <div>
    inputElement.focus();
    const mutableState: MutableState = getMutableState();
    mutableState.setSelectionBoth(mutableState.atBufferEnd());
    return mutableState.getState();
  }

  if (isHintResult(action)) {
    // click on a hint => set focus on the <input>
    inputElement.focus();
    const mutableState: MutableState = getMutableState();
    mutableState.replaceElement(action.inputIndex, action.hint);
    mutableState.setSelectionBoth(mutableState.atBufferEnd());
    return mutableState.getState();
  }

  if (isDeleteTag(action)) {
    const mutableState: MutableState = getMutableState();
    mutableState.replaceElement(action.index, "");
    return mutableState.getState();
  }

  if (isTagClick(action)) {
    const mutableState: MutableState = getMutableState();
    // want to position the cursor at the end of the selected word
    mutableState.selectEndOf(action.index);
    // clicking on the tag made the input lose the focus
    mutableState.focus();
    return mutableState.getState();
  }

  if (isKeyDown(action)) {
    const { key, shiftKey } = action;
    switch (key) {
      case "Home":
      case "ArrowUp": {
        // move selection to start of first tag
        const mutableState: MutableState = getMutableState();
        mutableState.setSelectionBoth(0);
        return mutableState.getState();
      }

      case "End":
      case "ArrowDown": {
        // move selection to end of last tag
        const mutableState: MutableState = getMutableState();
        mutableState.setSelectionBoth(mutableState.atBufferEnd());
        return mutableState.getState();
      }

      case "ArrowLeft": {
        const inputState: InputState = getInputState();
        // we're at the left of the input so traverse into the previous tag
        const mutableState: MutableState = getMutableState();
        const wanted = inputState.nextLeft;
        if (shiftKey) {
          mutableState.setSelectionStart(wanted);
        } else {
          mutableState.setSelectionBoth(wanted);
        }
        return mutableState.getState();
      }
      case "ArrowRight": {
        const inputState: InputState = getInputState();
        // we're at the right of the input so traverse into the next tag
        const mutableState: MutableState = getMutableState();
        const wanted = inputState.nextRight;
        if (shiftKey) {
          mutableState.setSelectionEnd(wanted);
        } else {
          mutableState.setSelectionBoth(wanted);
        }
        return mutableState.getState();
      }
      case "Backspace": {
        // same as ArrowLeft except also delete the space between the two tags
        const inputState: InputState = getInputState();
        const mutableState: MutableState = getMutableState();
        if (shiftKey) {
          // also delete whatever is selected
          inputState.removeSelected(mutableState);
        }
        const wanted = inputState.nextLeft;
        mutableState.remove(wanted, 1);
        mutableState.setSelectionBoth(wanted);
        return mutableState.getState();
      }
      case "Delete": {
        // same as ArrowRight except also delete the space between the two tags
        const inputState: InputState = getInputState();
        const mutableState: MutableState = getMutableState();
        if (shiftKey) {
          // also delete whatever is selected
          inputState.removeSelected(mutableState);
        }
        const wanted = inputState.currentStart;
        mutableState.remove(wanted, 1);
        mutableState.setSelectionBoth(wanted);
        return mutableState.getState();
      }
      default:
        break;
    } // switch
  } // if isKeyDown

  logRenderedState("reducer returning old state", state);
  return state;
} // reducer

/*
  Various helper functions
*/

// Helper function analogous to Array.splice -- string has built-in slice but no splice
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
function stringSplice(text: string, start: number, deleteCount: number, insert: string): string {
  // up to but not including start
  const textStart = text.substring(0, start);
  const textEnd = text.substring(start + deleteCount);
  const after = textStart + insert + textEnd;
  log("stringSplice", { text, start, deleteCount, insert, after });
  return after;
}

function log(title: string, o: object, force?: boolean): void {
  if (!isLogging && !force) {
    return;
  }
  const json = JSON.stringify(o, null, 2);
  console.log(`${title} -- ${json}`);
}

function logRenderedState(title: string, renderedState: RenderedState): void {
  log(title, renderedState);
}

// this identifies the index of the one-and-only <input> element within the array of RenderedElement
function getInputIndex(elements: ReadonlyArray<RenderedElement>, assert: Assert)
  : { inputIndex: number, isFirst: boolean, isLast: boolean } {
  let inputIndex: number = 0;
  let counted = 0;
  for (let i = 0; i < elements.length; ++i) {
    if (elements[i].type === "input") {
      ++counted;
      inputIndex = i;
    }
  }
  assert(counted === 1, "expected exactly one input element")
  return { inputIndex, isFirst: inputIndex === 0, isLast: inputIndex === elements.length - 1 };
}

// the getElementStart and assertElements functions have two versions
// i.e. they work with ReadonlyArray<RenderedElement> or ReadonlyArray<string>
// that's because the MutableState class works with ReadonlyArray<string> instead of ReadonlyArray<RenderedElement>
// because it doesn't yet know the type associated with each word

// Helper function to determine the offset into the buffer associated with a given RenderedElement
function getElementStart(elements: ReadonlyArray<RenderedElement>, index: number, assert: Assert): number {
  return getWordStart(elements.map(x => x.word), index, assert);
}
function getWordStart(words: ReadonlyArray<string>, index: number, assert: Assert): number {
  let wordStart = 0;
  for (let i = 0; i < index; ++i) {
    const word = words[i];
    // +1 because there's a whitespace between i.e. after each word
    wordStart += word.length + 1;
    // assert all words are significant (and visible)
    // it's OK if the last word is empty i.e. if the <input> element is beyond the end of the buffer
    // that wouldn't trigger this assertion because we're only testing for all i < index
    assert(!!word.length, "getWordStart unexpected zero-length word");
  }
  return wordStart;
}

// assert that the state is as predicted
function assertElements(elements: ReadonlyArray<RenderedElement>, buffer: string, assert: Assert): void {
  assertWords(elements.map(x => x.word), buffer, assert);
  getInputIndex(elements, assert);
  elements.forEach((element, index) =>
    assert(!!element.word.length || (element.type === "input" && index === elements.length - 1),
      "unexpected zero-length word"));
}
function assertWords(words: ReadonlyArray<string>, buffer: string, assert: Assert): void {
  for (let i = 0; i < words.length; ++i) {
    const word = words[i];
    const wordStart = getWordStart(words, i, assert);
    const fragment = buffer.substring(wordStart, wordStart + word.length);
    assert(word === fragment, "assertElements",
      // don't bother to call JSON.stringify unless the assertion has actually failed
      () => { return { word, fragment, wordStart, length: word.length, buffer, words } });
  }
}

function getTextWidth(text: string) {
  // https://stackoverflow.com/a/21015393/49942
  const getContext = (): CanvasRenderingContext2D | undefined => {
    if (!(getTextWidth as any).canvas) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        return undefined;
      }
      // matches the font famly and size defined in App.css
      context.font = '14px Arial, "Helvetica Neue", Helvetica, sans-serif';
      (getTextWidth as any).canvas = canvas;
      (getTextWidth as any).context = context;
    }
    return ((getTextWidth as any).context) as CanvasRenderingContext2D;
  }
  const context = getContext();
  if (!context) {
    return 20;
  }
  return context.measureText(text).width;
}

// see [Simulating `:focus-within`](./EDITORTAGS.md#simulating-focus-within)
function handleFocus(e: React.FocusEvent<HTMLElement>, hasFocus: boolean) {
  function isElement(related: EventTarget | HTMLElement): related is HTMLElement {
    return (related as HTMLElement).tagName !== undefined;
  }
  // read it
  const target = e.target;
  const relatedTarget = e.relatedTarget;
  // relatedTarget is of type EventTarget -- upcast from that to HTMLElement
  const related: HTMLElement | undefined = (relatedTarget && isElement(relatedTarget)) ? relatedTarget : undefined;
  // get the tagName and className of the element
  const relatedName = (!relatedTarget) ? "!target" : (!related) ? "!element" : related.tagName;
  const relatedClass = (!related) ? "" : related.className;
  // log it
  const activeElement = document.activeElement;
  const targetName = target.tagName;
  const activeElementName = (activeElement) ? activeElement.tagName : "!activeElement";
  log("handleFocus", { hasFocus, targetName, activeElementName, relatedName, relatedClass });
  // calculate it
  hasFocus = hasFocus || (relatedClass === "hint");
  // write the result
  const div = document.getElementById("tag-both")!;
  if (hasFocus) {
    div.className = "focussed";
  } else {
    div.className = "";
  }
}

/*
  Functions which construct the RenderedState
*/

// this function calculates a new RenderedState and sets the InputElement content and selection, for a given State value
// it's called from initialState and from MutableState
function renderState(state: State, assert: Assert, validation: Validation,
  inputElement?: InputElement, tagDictionary?: TagDictionary)
  : RenderedState {
  const elements: RenderedElement[] = [];
  let editing: number | undefined = undefined;
  let inputValue: string = "";

  function setInput(text: string, start: number, end: number, inputElement: InputElement): void {
    log("setInput", { text, start, end });
    inputElement.setContent(text, start, end);
    inputValue = text;
    assert(start >= 0 && end <= text.length, `setInput invalid range: ${text} ${start} ${end}`)
  }

  function addElement(type: "tag" | "input", word: string): void {
    const isValid: boolean = !word.length || validation.canNewTag || (!!tagDictionary && tagDictionary.exists(word));
    elements.push({ type, word, isValid });
  }

  // split the buffer
  const words: string[] = state.buffer.split(" ").filter(word => word.length);
  const selection = state.selection;

  // this is where each word starts, an index into the buffer
  let wordStart = 0;
  // this accumulates previous words within the selection, when selection is a range which spans more than one word
  let accumulated: { wordStart: number, start: number, text: string } | undefined = undefined;

  for (let wordIndex = 0; wordIndex < words.length; ++wordIndex) {
    const word = words[wordIndex];
    // e.g. if a word's length is 1, then the positions within this word are 0 (start) and 1 (end)
    const wordEnd = wordStart + word.length;
    if ((selection.start > wordEnd) || (selection.end < wordStart)) {
      // selection is not in this word
      // - selection starts beyond the end of the word
      // - or selection ends before the start of the word
      addElement("tag", word);
    } else {
      if (!inputElement) {
        // the initialState function should set the selection at the end of the buffer
        // i.e. beyond any words (if there are any words)
        // or at the start of the buffer if there are no words,
        // so that it isn't necessary to set the selection inside the input element
        // given that the input element hasn't been created in the DOM yet
        assert(false, "invalid initial state")
        continue;
      }
      // selection includes some of this word
      // - selection starts on or before the end of the word
      // - or selection ends on or after the start of the word
      if (selection.start >= wordStart) {
        // selection starts in this word
        if (selection.end <= wordEnd) {
          // selection starts and ends in this word
          setInput(word, selection.start - wordStart, selection.end - wordStart, inputElement);
          editing = elements.length;
          addElement("input", word);
        } else {
          // starts in this word but ends in a future word
          assert(!accumulated, "shouldn't accumulate anything previously")
          accumulated = { wordStart, start: selection.start - wordStart, text: word };
        }
      } else {
        // selection started before this word
        if (!accumulated) {
          assert(false, "should have accumulated something previously");
          continue; // this is bad but better than referencing accumulated when it's undefined
        }
        // add to what's already accumulated, including inter-word whitespace
        accumulated.text += " " + word;
        if (selection.end <= wordEnd) {
          // selection ends in this word
          setInput(accumulated.text, accumulated.start, selection.end - accumulated.wordStart, inputElement);
          editing = elements.length;
          addElement("input", accumulated.text);
          accumulated = undefined;
        } else {
          // selection ends in a future word (and we already added this word to the accumulator)
        }
      }
    }
    wordStart += word.length + 1;
  }

  if (typeof editing === "undefined") {
    // we haven't pushed the <input> element yet, so push it now
    editing = elements.length;
    // if (initializing) then the `input` and `inputRef` values haven't yet been created because the state is created
    // before they are, via the call to initialState -- but when it is created it's initially empty so that's alright
    if (inputElement) {
      // the <input> element is already part of the DOM; reset it now
      setInput("", 0, 0, inputElement);
    }
    addElement("input", "");
  }

  assertElements(elements, state.buffer, assert);

  const hints: TagCount[] = !tagDictionary ? [] : tagDictionary.getHints(inputValue, elements);
  // if logging only log the keyword of each hint, otherwise logging the tags' summaries makes it long and hard to read
  (hints as any).toJSON = () => "[" + hints.map(hint => hint.key).join(",") + "]";

  function getValidationError(): string {
    const nWords: number = elements.filter(element => !!element.word.length).length;
    const invalid: string[] = elements.filter(element => !element.isValid).map(element => element.word);
    if (nWords < 1 && validation.minimum) {
      return "Please enter at least one tag;";
    }
    if (nWords > 5 && validation.maximum) {
      return "Please enter a maximum of five tags.";
    }
    if (!!invalid.length) {
      return (invalid.length === 1)
        ? `Tag '${invalid[0]}' does not match an existing topic.`
        : `Tags ${invalid.map(word => "'" + word + "'").join(" and ")} do not match existing topics.`
    }
    return "";
  }
  const validationError = getValidationError();

  const renderedState: RenderedState = { state, elements, inputValue, hints, validationError };
  return renderedState;
}

// this function calculates the initial state, calculated from props and used to initialize useState
function initialState(assert: Assert, inputTags: string[], validation: Validation): RenderedState {
  assert(!inputTags.some(found => found !== found.trim()), "input tags not trimmed", () => { return { inputTags }; });
  const buffer = inputTags.join(" ");
  const start = buffer.length + 1;
  const state: State = { buffer, selection: { start, end: start } };

  log("initialState starting", { inputTags })
  const renderedState: RenderedState = renderState(state, assert, validation);
  logRenderedState("initialState returning", renderedState)
  return renderedState;
}

/*

  EditorTags -- the functional component

*/

export const EditorTags: React.FunctionComponent<EditorTagsProps> = (props) => {

  const { inputTags, result, getAllTags } = props;
  const validation: Validation = props;

  /*
    React hooks
  */

  // this is an optional error message
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

  function assert(assertion: boolean, message: string, extra?: () => object): void {
    if (!assertion) {
      if (extra) {
        const o: object = extra();
        const json = JSON.stringify(o, null, 2);
        message = `${message} -- ${json}`;
      }
      // write to errorMessage state means it's displayed by the `<ErrorMessage errorMessage={errorMessage} />` element
      setTimeout(() => {
        // do it after a timeout because otherwise if we do this during a render then React will complain with:
        //   "Too many re-renders. React limits the number of renders to prevent an infinite loop."
        setErrorMessage(message);
      }, 0);
      console.error(message);
    }
  }

  // see ./EDITOR.md and the definition of the RenderedState interface for a description of this state
  // also https://fettblog.eu/typescript-react/hooks/#usereducer says that type is infered from signature of reducer
  const [state, dispatch] = React.useReducer(reducer, inputTags,
    (inputTags) => initialState(assert, inputTags, validation));

  // this is a dictionary of existing tags
  const [tagDictionary, setTagDictionary] = React.useState<TagDictionary | undefined>(undefined);

  logRenderedState("--RENDERING--", state);

  // useEffect to fetch all the tags from the server exactly once
  // React's elint rules demand that getAllTags be specified in the deps array, but the value of getAllTags
  // (which we're being passed as a parameter) is utimately a function at module scope, so it won't vary
  React.useEffect(() => {
    // get tags from server
    getAllTags()
      .then((tags) => {
        // use them to contruct a dictionary
        const tagDictionary: TagDictionary = new TagDictionary(tags);
        // save the dictionary in state
        setTagDictionary(tagDictionary);
      })
      .catch((reason) => {
        // alarm the user
        setErrorMessage(`getAllTags() failed -- ${reason}`);
      });
  }, [getAllTags]);

  /*
    inputRef (data which is used by some of the event handlers)
  */

  const inputRef = React.createRef<HTMLInputElement>();

  /*
    Event handlers (which dispatch to the reducer)
  */

  function getContext(inputElement: HTMLInputElement): Context {
    return { inputElement: new InputElement(inputElement, assert), assert, result, tagDictionary, validation };
  }

  function handleEditorClick(e: React.MouseEvent) {
    const isDiv = (e.target as HTMLElement).tagName === "DIV";
    if (!isDiv) {
      // this wasn't a click on the <div> itself, presumably instead a click on something inside the div
      return;
    }
    dispatch({ type: "EditorClick", context: getContext(inputRef.current!) });
  }

  function handleDeleteTag(index: number, e: React.MouseEvent) {
    dispatch({ type: "DeleteTag", context: getContext(inputRef.current!), index });
    e.preventDefault();
  }

  function handleTagClick(index: number, e: React.MouseEvent) {
    dispatch({ type: "TagClick", context: getContext(inputRef.current!), index });
    e.preventDefault();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: "Change", context: getContext(e.target) });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      // do nothing and prevent form submission
      e.preventDefault();
      return;
    }
    // apparently dispatch calls the reducer asynchonously, i.e. after this event handler returns, which will be too
    // late to call e.preventDefault(), and so we need two-stage processing, i.e. some here and some inside the reducer:
    // - here we need to test whether the action will or should be handled within the reducer
    // - later in the reducer we need to actually perform the action
    function newinputState() {
      const inputElement: InputElement = new InputElement(e.target as HTMLInputElement, assert);
      return new InputState(state, inputElement, assert);
    }
    function isHandled(): boolean {
      switch (e.key) {
        case "Home":
        case "ArrowUp":
          // move selection to start of first tag
          return !getInputIndex(state.elements, assert).isFirst;
        case "End":
        case "ArrowDown":
          // move selection to end of last tag
          return !getInputIndex(state.elements, assert).isLast;
        case "ArrowLeft":
        case "Backspace": {
          const inputState: InputState = newinputState();
          return inputState.canMoveLeft;
        }
        case "ArrowRight":
        case "Delete": {
          const inputState: InputState = newinputState();
          return inputState.canMoveRight;
        }
        default:
          break;
      } // switch
      return false;
    }
    if (isHandled()) {
      e.preventDefault();
      const context: Context = getContext(e.target as HTMLInputElement);
      dispatch({ type: "KeyDown", context, key: e.key, shiftKey: e.shiftKey });
    }
  }

  function handleHintResult(outputTag: string) {
    const { inputIndex } = getInputIndex(state.elements, assert);
    dispatch({ type: "HintResult", context: getContext(inputRef.current!), hint: outputTag, inputIndex });
  }

  /*
    Tag is a FunctionComponent to render each tag
  */

  interface TagProps { text: string, index: number, isValid: boolean };
  const Tag: React.FunctionComponent<TagProps> = (props) => {
    const { text, index, isValid } = props;
    // https://reactjs.org/docs/handling-events.html#passing-arguments-to-event-handlers
    // eslint-disable-next-line
    const close = <a onClick={(e) => handleDeleteTag(index, e)} title="Remove tag"><Icon.Close height="12" /></a>;
    const className = isValid ? "tag" : "tag invalid";
    return <span className={className} onClick={(e) => handleTagClick(index, e)}>
      {text}
      {close}
    </span>
  }

  /*
    The return statement which yields the JSX.Element from this function component
  */

  function showValidationResult() {
    const showError = props.showValidationError && !!state.validationError.length;
    if (!showError) {
      return { className: "tag-editor", icon: undefined, validationError: undefined };
    }
    const className = "tag-editor invalid validated";
    const icon = <Icon.Error className="error" />;
    const validationErrorMessage = state.validationError;
    // use <a href={}> instead of <Link to={}> -- https://github.com/ReactTraining/react-router/issues/6344
    const suffix = (validationErrorMessage[validationErrorMessage.length - 1] !== ";") ? undefined :
      (
        <React.Fragment>
          {"see a list of "}
          <a href={props.hrefAllTags} target="_blank" rel="noopener noreferrer">popular tags</a>{"."}
        </React.Fragment>
      );
    const validationError = <p className="error">{validationErrorMessage} {suffix}</p>;
    return { validationError, icon, className };
  }
  const { validationError, icon, className } = showValidationResult();

  function getElement(element: RenderedElement, index: number): React.ReactElement {
    const isValid = !props.showValidationError || element.isValid;
    return (element.type === "tag")
      ? <Tag text={element.word} index={index} key={index} isValid={isValid} />
      : <input type="text" key="input" ref={inputRef} className={isValid ? undefined : "invalid"} width={10}
        onKeyDown={handleKeyDown} onChange={handleChange}
        onFocus={e => handleFocus(e, true)} onBlur={e => handleFocus(e, false)} />
  }

  return (
    <div id="tag-both" >
      <div className={className} onClickCapture={handleEditorClick}>
        {state.elements.map(getElement)}
        {icon}
      </div>
      <ShowHints hints={state.hints} inputValue={state.inputValue} result={handleHintResult} />
      <ErrorMessage errorMessage={errorMessage} />
      {validationError}
    </div>
  );
}

/*

  ShowHints

*/

interface ShowHintsProps {
  // hints (from dictionary)
  hints: TagCount[],
  // the current value of the tag in the editor
  inputValue: string,
  // callback of tag selected from list of hints if user clicks on it
  result: (outputTag: string) => void
}
const ShowHints: React.FunctionComponent<ShowHintsProps> = (props) => {
  const { hints, inputValue, result } = props;
  if (!inputValue.length) {
    return <div className="tag-hints hidden"></div>;
  }
  return (
    <div className="tag-hints">
      {!hints.length ? "No results found." : hints.map(hint =>
        <ShowHint hint={hint} inputValue={inputValue} result={result} key={hint.key} />)}
    </div>
  );
}

interface ShowHintProps {
  // hints (from dictionary)
  hint: TagCount,
  // the current value of the tag in the editor
  inputValue: string,
  // callback of tag selected from list of hints if user clicks on it
  result: (outputTag: string) => void
}
const ShowHint: React.FunctionComponent<ShowHintProps> = (props) => {
  const { hint, inputValue, result } = props;

  function getTag(key: string) {
    const index = key.indexOf(inputValue);
    return (
      <span className="tag">
        {(index === -1) ? key :
          <React.Fragment>
            {key.substring(0, index)}
            <span className="match">{inputValue}</span>
            {key.substring(index + inputValue.length)}
          </React.Fragment>}
      </span>
    );
  }
  // the key with the matched letters highlighted
  const tag = getTag(hint.key);
  // count the number of times this tag is used elsewhere, if any
  const count = (hint.count) ? <span className="multiplier">×&nbsp;{hint.count}</span> : undefined;
  // the summary, if any
  const summary = (hint.summary) ? <p>{hint.summary}</p> : undefined;
  // a link to more info i.e. the page which defines this tag
  function getMore(key: string) {
    const icon = <Icon.Info width="16" height="16" />;
    // we use <a> here instead of <Link> because this link will open a whole new tab, i.e. another instance of this SPA
    // in future I think it would be better to reimplement this as a split screen (two-column) view
    const anchor = <a href={`/tags/${key}/info`} target="_blank" rel="noopener noreferrer">{icon}</a>;
    return <p className="more-info">{anchor}</p>;
  }
  const more = getMore(hint.key);
  return (
    <div className="hint" tabIndex={0} key={hint.key}
      onClick={e => result(hint.key)}
      onKeyDown={e => { if (e.key === "Enter") result(hint.key); e.preventDefault() }}
      onFocus={e => handleFocus(e, true)} onBlur={e => handleFocus(e, false)} >
      {tag}
      {count}
      {summary}
      {more}
    </div>
  );
}
