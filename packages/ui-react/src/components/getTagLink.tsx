import { Data, Url } from 'client/src';
import React from 'react';

import { Link } from './Link';

export function getTagLink(tag: Data.Key): React.ReactElement {
  const href = Url.getTagUrl(tag);
  return (
    <Link className="tag" to={href}>
      {tag.key}
    </Link>
  );
}
