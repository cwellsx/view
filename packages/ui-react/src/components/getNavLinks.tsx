import React from 'react';

import { NavLink } from './Link';

export function getNavLinks(
  wanted: Array<{ text: string; n: number } | undefined>,
  href: (page: number) => string,
  title: (n: number) => string,
  current: number,
  spanifySelected: boolean
): React.ReactElement[] {
  return wanted.map((x, index) => {
    if (!x) {
      const before: number = (wanted[index - 1] as { text: string; n: number }).n;
      return (
        <span key={"dots-" + before} className="dots">
          …
        </span>
      );
    }
    const { text, n } = x;
    if (spanifySelected && current === n) {
      return (
        <span className="selected" key={text}>
          {text}
        </span>
      );
    }
    const className = current === n ? "selected" : undefined;
    return (
      <NavLink to={href(n)} key={text} title={title(n)} className={className}>
        {text}
      </NavLink>
    );
  });
}
