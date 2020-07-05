import { Api, config, Data, loginUser } from 'client/src';
import React from 'react';

type Me = Data.UserSummary | undefined;

type AppContextProps = {
  me?: Data.UserSummary;
  setMe(me: Me): void;
  api?: Api;
  pushHistory(url: string): void;
};

// https://fettblog.eu/typescript-react/context/
export const AppContext = React.createContext<AppContextProps>({
  me: undefined,
  setMe: (me: Me) => {},
  api: undefined,
  pushHistory: (url: string) => {},
});

export function useMe(): Me {
  const appContext: AppContextProps = React.useContext(AppContext);
  return appContext.me;
}

export function useApi(): Api {
  const appContext: AppContextProps = React.useContext(AppContext);
  return appContext.api!;
}

// this makes the application's use of History independent of ReactRouter's implementation of history
export function usePushHistory(): (url: string) => void {
  const appContext: AppContextProps = React.useContext(AppContext);
  return appContext.pushHistory;
}

export function useSetMe(): (me: Me) => void {
  const appContext: AppContextProps = React.useContext(AppContext);
  return appContext.setMe;
}
export function useCreateMe(): [Me, React.Dispatch<React.SetStateAction<Me>>] {
  // https://fettblog.eu/typescript-react/context/ and
  // https://reactjs.org/docs/context.html#updating-context-from-a-nested-component
  const autologin = config.autologin ? loginUser() : undefined;
  return React.useState<Me>(autologin);
}
