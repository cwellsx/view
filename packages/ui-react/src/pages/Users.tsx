import React from "react";
import { Api, Data } from "client";
import { useFetchApi } from "../hooks";
import { getPage, FetchedT } from "../layouts";
import { getUserInfo } from "../components";
import { Layout, KeyedItem } from "../PageLayout";

export const Users: React.FunctionComponent = () => {
  return getPage(useFetchApi(Api.getUsers), showUsers);
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
