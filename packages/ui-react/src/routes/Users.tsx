import { Data } from 'client/src';
import React from 'react';

import { getUserInfo } from '../components';
import { useApi, useFetchApi } from '../hooks';
import { FetchedT, getPage, Layout } from '../layouts';

export const Users: React.FunctionComponent = () => {
  const api = useApi();
  return getPage(useFetchApi(api.getUsers), showUsers);
};

function showUsers(fetched: FetchedT<Data.UserSummaryEx[], void>): Layout {
  const { data } = fetched;
  const users: React.ReactElement = (
    <div className="all-users">
      {data.map((user) => {
        return getUserInfo(user, "big");
      })}
    </div>
  );
  return {
    main: { content: users, title: "Users" },
    width: "Grid",
  };
}
