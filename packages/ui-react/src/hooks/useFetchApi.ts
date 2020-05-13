import React from "react";

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

  // const layout: Layout =
  //   data && prev === param
  //     ? getLayout(data, extra2) // render the data
  //     : error
  //     ? loadingError(error)
  //     : loadingContents; // else no data yet to render

  // return useLayout(layout);
  return { data: prev === param ? data : undefined, error, reload, newData };
}
