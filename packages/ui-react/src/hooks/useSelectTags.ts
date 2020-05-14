import { Data } from "client";
import React from "react";
import {
  Action,
  Assert,
  initialState,
  reducer,
  RenderedState,
  TagDictionary,
  Validation,
} from "../components/SelectTagsState";

type TagCount = Data.TagCount;

export function useSelectTags(
  inputTags: string[],
  getAllTags: () => Promise<TagCount[]>,
  validation: Validation
): {
  state: RenderedState;
  dispatch: React.Dispatch<Action>;
  tagDictionary: TagDictionary | undefined;
  assert: Assert;
  errorMessage: string | undefined;
} {
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
  const [state, dispatch] = React.useReducer(reducer, inputTags, (inputTags) =>
    initialState(assert, inputTags, validation)
  );

  // this is a dictionary of existing tags
  const [tagDictionary, setTagDictionary] = React.useState<TagDictionary | undefined>(undefined);

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
    Event handlers
  */

  return { state, dispatch, tagDictionary, assert, errorMessage };
}
