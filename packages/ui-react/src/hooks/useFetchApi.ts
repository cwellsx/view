import React from "react";

/*
  This is a "high-order component", a "custom hook" -- it separates "getting" the data from "presenting" the data.

  - https://reactjs.org/docs/higher-order-components.html
  - https://reactjs.org/docs/hooks-custom.html

  The sequence of events is:

  1. Called for the first time
  2. Returns `undefined` as the data value
  3. useEffect fires and:
     - Call getData to fetch data from the server
     - Call setData to write the fetched data into the state
     - Returns the fetched data value

  Fetching data is as described at:

  - https://reactjs.org/docs/hooks-faq.html#how-can-i-do-data-fetching-with-hooks
  - https://overreacted.io/a-complete-guide-to-useeffect/
  - https://www.robinwieruch.de/react-hooks-fetch-data

  And using a hook with TypeScript:

  - https://www.carlrippon.com/typed-usestate-with-typescript/

  The template supports a parameter of type TParam (which is optional and may be void/undefined).
  If specified then the parameter is passed to the getData function.

  ---

  Also, as described here ...

  https://stackoverflow.com/questions/56096560/avoid-old-data-when-using-useeffect-to-fetch-data

  ... if the parameter value changes then there's a brief wndow before the useEffect hook is run.
  Therefore the param value is stored in state whenever the data value is stored,
  and the data value is discarded when it's associated param value doesn't match the current param value.

  The solution described here ...

  https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect

  ... i.e. to "wrap it into the useCallback Hook" was insufficient because it leaves a brief
  timing hole before the useEffect fires and the data is refetched.
*/

export interface FetchingT<TData, TParam2> {
  // type of data returned by the client API
  data: TData | undefined;
  error: Error | undefined;
  reload: () => void;
  newData: (param2: TParam2) => Promise<void>;
}

// this gets data from the server
type IoGetDataT<TData, TParam, TParam2 = void> = (param: TParam, param2?: TParam2) => Promise<TData>;

// this value is passed as param to useGetLayout when TParam is void
// or I could have implemented a copy-and-paste of useGetLayout without the TParam
const isVoid: void = (() => {})();

export function useFetchApi<TData>(getData: IoGetDataT<TData, void, void>): FetchingT<TData, void> {
  return useFetchApi2(getData, isVoid);
}

export function useFetchApi2<TData, TParam, TParam2 = void>(
  // client API function
  getData: IoGetDataT<TData, TParam, TParam2>,
  // parameter passed to the getData function
  param: TParam
): FetchingT<TData, TParam2> {
  const [prev, setParam] = React.useState<TParam | undefined>(undefined);
  const [data, setData] = React.useState<TData | undefined>(undefined);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  // we pass the reload function to the getLayout function so that it can force a reload e.g. after
  // posting a new message to the server. We force a reload because nothing has changed on the client --
  // not even the URL -- but we want to fetch/refresh the data from the server.
  // https://stackoverflow.com/questions/46240647/can-i-call-forceupdate-in-stateless-component
  const [toggle, setToggle] = React.useState<boolean>(true);
  function reload() {
    setToggle(!toggle); // toggle the state to force render
  }

  // we pass a newData function to the getLayout function so that it can invoke the network I/O function again
  // with a new parameter (see the ThrottledInput function) and store the new data and the new parameter back here
  const newData = React.useMemo(() => {
    const getDataAgain: (param2: TParam2) => Promise<void> = (param2: TParam2) => {
      const promise = getData(param, param2);
      const rc: Promise<void> = new Promise<void>((resolve, reject) => {
        promise.then((fetched: TData) => {
          // the layout function has fetched new data with a new parameter
          // so redo now what was originally done at the end of useEffect
          setData(fetched);
          // setParam(param);
          resolve();
        });
        promise.catch((error) => {
          reject(error);
        });
      });
      return rc;
    };
    return getDataAgain;
  }, [getData, param]);

  // add the reload function to the extra data which we pass as a parameter to the layout function
  // so that the layout function can call reload() if it wants to
  //const extra2: TExtra & Extra<TParam2> = { ...extra, reload, newData };

  React.useEffect(() => {
    getData(param)
      .then((fetched) => {
        setData(fetched);
        setParam(param);
      })
      .catch((reason) => {
        console.log(`useEffect failed ${reason}`);
        setError(reason);
      });
  }, [getData, param, toggle]);

  // TODO https://www.robinwieruch.de/react-hooks-fetch-data/#react-hooks-abort-data-fetching

  return { data: prev === param ? data : undefined, error, reload, newData };
}
