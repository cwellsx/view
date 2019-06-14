# `EditorTags`

The [`EditorTags`](./EditorTags.tsx) component lets you edit and select the tags associated with a topic.

- [Appearance and behaviour](#appearance-and-behaviour)
- [Implementation state data](#implementation-state-data)
- [Sequence of definitions](#sequence-of-definitions)
  - [Problem constraints](#problem-constraints)
  - [Solution as implemented](#solution-as-implemented)
- [Controlling the `<input>` element](#controlling-the-input-element)
- [Simulating `:focus-within`](#simulating-focus-within)

## Appearance and behaviour

It looks like a simple `<input type="text">` control, which contains multiple words -- one word per tag --
however all words except the currently-selected word have some visible style applied to them.

It's implemented as a `<div>` like this:

```tsx
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
```

The `<div>` -- and the `state.elements` array shown above -- contains:

- Exactly one `<input>` element, in which you edit the currently-selected word
- One or more React components of my type `<Tag>`, which style the other words which you're not currently editing

The `<input>` element may be:

- Alone in the `<div>`
- The first or the last element in the `<div>`, either before or after all `<Tag>` elements
- In the middle of the `<div>`, with `<Tag>` elements to its left and right

When you use the cursor keys (including <kbd>ArrowLeft</kbd> and <kbd>ArrowRight</kbd>) to scroll beyond the edge of
the `<input>` control, then this component detects that and changes its selection of which tag is currently editable.

## Implementation state data

There's quite a bit of state (i.e. member data) associated with this component:

- A `state.buffer` string whose value equals the current string or array of words (i.e. tags) being edited
- A `state.selection` index or range, that identifies which word is currently being edited --
this is a `start` and `end` range, because you can select a range of text,
e.g. by pressing the <kbd>Shift</kbd> key when you use the cursor keys
- The `elements` array, which is calculated from the buffer and the selection range, and which identifies which word is
associated with the `<input>` element and which other words are associated with the `<Tag>` elements.
- The `inputValue` which identifies the current value of the `<input>` element
- A `hints` array which lists the possible tags which might be a match for the input value
- A `validationError` message if the current tags are invalid and deserve an error message

```typescript
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
```

Because there's a lot of data, and the data elements are inter-related,
I implement it with `useReducer` instead of `useState`.

## Sequence of definitions

The sequence in which things are defined in the source file is significant --
and it's fragile, i.e. if you don't do it right then there's a compiler error about using something before it's defined,
or a run-time error about using something with an undefined value.

### Problem constraints

The definitions in the source file (the module) include:

- Data -- especially `inputRef` and `state`
- Functions
- Classes

I think the following observations are true:

- `inputRef` must be defined before `input`
- `inputRef.current` is undefined until after the `input` is defined, **and** has been rendered into the DOM --
it exists when an event-handler is invoked, but never when the function component is being run (i.e. before each render)
- `state` must be defined before `input` (because the `<input value={state.inputValue} />` property depends on `state`)
- `state` is defined using `useReducer` which will invoke the `initialState` function (to get the initial state)

Therefore the `initialState` function -- and the `renderState` function which is called from `initialState` -- cannot
reference the `inputRef.current` data.

Furthermore:

- TypeScript class definitions behave like data definitions, i.e. the class must be defined before it's instantiated.
- The location of a function definition doesn't matter because "function statements are subject to hoisting".
- However it's an error if a function is invoked, if the function references `const` state data -- and/or if it
instantiates a TypeScript class -- which hasn't yet been defined at the location where the function was called from.

### Solution as implemented

So, to avoid compile-time and run-time errors, I use the following strategy:

- Because the `initialState` and therefore the `renderState` functions are called when the `state` is initialized and
before `inputRef.current` exists, this function and anything called from this function cannot reference the state data.
- To ensure they don't reference the state data, they're defined in the `EditorTabs.tsx` module (for convenience),
but defined outside the `EditorTags` function component inside which the state data are defined, so that the compiler
would error if they were referenced from those functions.

So the following are defined outside the function component:

- The `initialState` and `renderState` functions
- Any TypeScript class definitions which these functions use
- Any other TypeScript type definitions which these functions or classes use -- so, for simplicity, every TypeScript
type definition.
- Any small helper/utility functions which these functions use -- and so, for simplicity, all helper/utility functions
- Because a reducer should be stateless or pure, it too is defined outside the function component
- And therefore also the TypeScript type definitions of the action types, and the corresponding user-defined type guards

So the following remain inside the function component:

- All state data
- All event handlers (which delegate to the reducer, and which may reference `inputRef.current`)
- The `assert` function depends on the `setErrorMessage` function, which is state -- so the `assert` function too is
defined inside the function component, and is passed as a parameter to any function which needs it.

Data that's stored inside the function component, and which isn't stored as state,
is passed to the reducer in the "action".

```typescript
interface ActionEditorClick { type: "EditorClick", context: Context };
interface ActionHintResult { type: "HintResult", context: Context, hint: string, inputIndex: number };
interface ActionDeleteTag { type: "DeleteTag", context: Context, index: number };
interface ActionTagClick { type: "TagClick", context: Context, index: number };
interface ActionKeyDown { type: "KeyDown", context: Context, key: string, shiftKey: boolean };
interface ActionChange { type: "Change", context: Context };
```

All the `Action` types include an `InputElement` (which is created by the event handler which generates the action),
because the `MutableState` class (called from the reducer) requires an `InputElement`, in order to update the `State`
(including the `buffer` and the `selection`) to match the contents of the `<input>` element.

In fact there's other data too, which the reducer needs and is passed in the action:

```typescript
// this is extra data which event handlers pass (as part of the action) from the function component to the reducer
interface Context {
  inputElement: InputElement;
  assert: Assert;
  result: ParentCallback;
  tagDictionary?: TagDictionary;
  validation: Validation;
};
```

## Controlling the `<input>` element

The `<input>` element is a semi-controlled component (see e.g.
"[What are Controlled Components in React?](https://www.robinwieruch.de/react-controlled-components/)").

There's an `inputRef` as well to access to the underlying HTML element, which is used to set the focus, and
to get and set the selection range within the element, but not to get the value of the element --
the value of the element is got via its `onChange` handler (and the `value` property of the event's `target`).

Note that React's `onChange` event handler has redefined (non-standard) semantics -- i.e. it's fired after every change,
and not only when it loses focus.

I say that it's "semi" controlled, because although its `onChange` handler writes its value to state ...

```typescript
<input type="text" ref={inputRef} onChange={handleChange} ...
```

... it does **not** have a corresponding `value` property which might read its value from state ...

```typescript
<input type="text" ref={inputRef} onChange={handleChange} value={state.inputValue} ...
```

The reason why not is because if the value property is used to write a string into a previously-empty
input element, then the selection range within the control is automatically pushed to the end of the new string.

This interferes with the desired behaviour of the <kbd>ArrowRight</kbd> key, where we want to copy
the next (to the right) tag into the input control, and set the selection range to the **beginning** of the control.

So, instead, the `setInput` function writes into the `value` property of the underlying `HTMLInputElement`.

- I worried that doing this might trigger another `onChange` event, but it doesn't seem to.
- An alternative might be to use `useEffect` to alter the selection of the input (to match the selection specified in
the state), after it's rendered.
That seems like even more of a kluge, though -- making it "semi-controlled" instead, i.e. writing to the DOM element,
seems neater.

The `inputValue` element also still exists as an alement of the `RenderedState` data,
but it's write-only -- i.e. it's up-to-date (and a opy of what was written into the DOM element).

## Simulating `:focus-within`

There are a couple of effects in [`EditorTags.css`](./EditorTags.css) for example ...

```css
.tag-hints {
  visibility: hidden;
}

.tag-both:focus-within .tag-hints {
  visibility: visible;
}
```

... where is would be convenient to use `:focus-within`. However that's not supported by some browsers (e.g. Edge).
Although the "Create React App" setup include `postcss` modules, they're not configurable --
"[You cannot customize postcss rules](https://github.com/facebook/create-react-app/issues/5749#issuecomment-436852753)"
-- and the default configuration doesn't enable support for `postcss-focus-within`.

To avoid the complexity or fragility of trying to bypass the CRA default configuration,
instead I use `onfocus` and `onBlur` handlers to simulate `:focus-within`
(by adding or removing `focussed` to the `class` value).

There's also complexity in deciding whether something has lost focus.

- The problem is that, using React's synthetic events, `onBlur` fires before `onFocus` --
so focus seems lost when focus moves from `.tag-editor input` to one of the `.hint` elements.
- The right the right way to support this functionality would be to use the `focusin` event as described in
[Focus Event Order](https://www.w3.org/TR/2014/WD-DOM-Level-3-Events-20140925/#events-focusevent-event-order),
however React's synthetic events don't support `focusin` -- https://github.com/facebook/react/issues/6410

Solutions like ...

- [Dealing with focus and blur in a composite widget in
React](https://medium.com/@jessebeach/dealing-with-focus-and-blur-in-a-composite-widget-in-react-90d3c3b49a9b)
- The [`react-focus-within`](https://www.npmjs.com/package/react-focus-within) package

... solve this using a timer in some way --
which is probably good, only I'm not certain of the sequence in which events are emitted.

So instead I use a solution (see the `handleFocus` function) which depends on the `relatedTarget` of the event:

- That works on my machine (Windows 10), at least, using Chrome, Firefox, and Edge.
- https://github.com/facebook/react/issues/3751 warns that apparently this won't work with IE 9 through IE 11,
though comments there say that document.activeElement might help make it work on IE

Otherwise, if support for IE (not just Edge) is needed, one of the other solutions listed earlier above might be better.
