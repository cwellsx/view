# `EditorTags`

The [`EditorTags`](./EditorTags.tsx) component lets you select (edit) the tags associated with a topic.

## Appearance and behaviour

It looks like a simple `<input type="text">` control, which contains multiple words (one word per tag),
however all words except the currently-selected word have some visible style applied to them.

It's implemented as a `<div>` like this:

```tsx
  function getElement(x: RenderedElement, index: number): React.ReactElement {
    return (x.type === "tag")
      ? <Tag text={x.word} index={index} key={index} />
      : <input type="text" key="input" ref={inputRef} size={10}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        value={state.inputValue} />
  }

  return (
    <React.Fragment>
      <div className="tag-editor" onClickCapture={handleEditorClick}>
        {state.elements.map(getElement)}
      </div>
      <ErrorMessage errorMessage={errorMessage} />
    </React.Fragment>
  );
```

The `<div>` -- and the `state.elements` array shown above -- contains:

- Exactly one `<input>` element, in which you edit the currently-selected word
- One or more React components of type `<Tag>`, which style the other words which you're not currently editing

The `<input>` element may be:

- Alone in the `<div>`
- The first element in the `<div>` before some subsequent `<Tag>` elements
- The last element in the `<div>` after all previous `<Tag>` elements
- In the middle of the `<div>` with `<Tag>` elements to its left and right

When you use the cursor keys (including <kbd>ArrowLeft</kbd> and <kbd>ArrowRight</kbd>) to scroll beyond the edge of
the `<input>` control, then this component detects that and changes its selection of which tag is currently editable.

## Implementation state data

There's quite a bit of state (i.e. member data) associated with this component:

- The `<input>` element, which is reused from one render to the next, though its contents and its position within the
`<div>` will change
- The current string or array of words (i.e. tags) being edited
- A selection index that identifies which word is currently being edited (this is a `start` and `end` range because
you can select a range of text e.g. by pressing the <kbd>Shift</kbd> key when you use the cursor keys)
- The calculated `elements` array, which contains the `<input>` element and the `<Tag>` components, and which is
calculated based on the words and the selection index.

Because there's a lot of data, and the data elements are inter-related,
I implement it with `useReducer` rather than with `useState`.

## Sequence of definitions

The sequence in which things are defined in the source file is significant and fragile --
if you don't do it right, there's a error about using something before it's defined.

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

The `assert` function depends on the `setErrorMessage` function, which is state -- so the `assert` function too is
defined inside the function component, and is passed as a parameter to any function which needs it.

All the `Action` types include an `InputElement` (which is created by the event handler which generates the action),
because the `MutableState` class (called from the reducer) requires an `InputElement`, in order to update the `State`
(including the `buffer` and the `selection`) to match the contents of the `<input>` element.

## Controlling the `<input>` element

The `<input>` element is a semi-controlled component (see e.g.
[What are Controlled Components in React?](https://www.robinwieruch.de/react-controlled-components/)).

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

So, instead, the `setInput` writes into the `value` property of the underlying `HTMLInputElement`.

- I worried that doing this might trigger another `onChange` event, but it doesn't seem to.
- An alternative might be to use `useEffect` to alter the selection of the input (to match the selection specified in
the state), after it's rendered.
That seems like even more of a kluge, though -- making it "semi-controlled" instead, i.e. writing to the DOM element,
seems neater.

The `inputValue` element also still exists as an alement of the `RenderedState` data,
but it's write-only -- i.e. it's up-to-date (and a opy of what was written into the DOM element), but nobody reads it.