import React from 'react';
import * as I from "../data";

export type AppContextProps = {
  me?: I.UserSummary,
  setMe(me: I.UserSummary | undefined): void
};

// https://fettblog.eu/typescript-react/context/
export const AppContext = React.createContext<AppContextProps>({
  me: undefined,
  setMe: (me: I.UserSummary | undefined) => {}
});
