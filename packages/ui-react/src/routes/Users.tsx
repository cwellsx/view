import { Data } from 'client/src';
import React from 'react';

import { getUserInfo } from '../components';
import { FetchedT, Layout } from '../layouts';

export function showUsers(fetched: FetchedT<Data.UserSummaryEx[], void>): Layout {
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
