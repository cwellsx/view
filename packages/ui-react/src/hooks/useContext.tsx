import React from "react";
import { Data } from "client";

type AppContextProps = {
  me?: Data.UserSummary;
  setMe(me: Data.UserSummary | undefined): void;
};

// https://fettblog.eu/typescript-react/context/
export const AppContext = React.createContext<AppContextProps>({
  me: undefined,
  setMe: (me: Data.UserSummary | undefined) => {},
});

export function useMe(): Data.UserSummary | undefined {
  const appContext: AppContextProps = React.useContext(AppContext);
  return appContext.me;
}

// export function useSetMe(me: Data.UserSummary | undefined): void {
//   const appContext: AppContextProps = React.useContext(AppContext);
//   appContext.setMe(me);
// }

export function useSetMe(): (me: Data.UserSummary | undefined) => void {
  const appContext: AppContextProps = React.useContext(AppContext);
  return appContext.setMe;
}
