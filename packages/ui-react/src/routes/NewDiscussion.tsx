import { config } from 'client/src';
import React from 'react';

import { NewDiscussion as NewDiscussionElement } from '../forms';
import { Layout } from '../layouts';

export function showNewDiscussion(): Layout {
  // this is unusual because we don't need to fetch data before rendering this element
  const content = <NewDiscussionElement />;
  const title = config.strNewQuestion.title;
  return {
    main: { content, title },
    width: "None",
  };
}
