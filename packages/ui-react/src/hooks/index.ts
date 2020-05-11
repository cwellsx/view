export { useFetchApi, useFetchApi2 } from "./useFetchApi";
export { AppContext, useMe, useSetMe, useCreateMe } from "./useContext";

export interface FetchingT<TData, TParam2> {
  // type of data returned by the client API
  data: TData | undefined;
  error: Error | undefined;
  reload: () => void;
  newData: (param2: TParam2) => Promise<void>;
}
