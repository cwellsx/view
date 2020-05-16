import React from "react";
import { getNavLinks } from "./getNavLinks";

function getPageNumbers(current: number, max: number): Array<{ text: string; n: number } | undefined> {
  function numbers(first: number, last: number): Array<number | undefined> {
    // https://stackoverflow.com/questions/3746725/how-to-create-an-array-containing-1-n
    // says that convenient ways to do this are for higher versions of ES than supported in this project
    const rc: number[] = [];
    for (let i = first; i <= last; ++i) {
      rc.push(i);
    }
    return rc;
  }
  const wanted: Array<number | undefined> =
    max <= 6
      ? numbers(1, max)
      : current - 1 <= 3
      ? numbers(1, 5).concat([undefined, max])
      : max - current <= 3
      ? [1, undefined].concat(numbers(max - 4, max))
      : [1, undefined].concat(numbers(current - 2, current + 2)).concat(undefined, max);
  const rc: Array<{ text: string; n: number } | undefined> = wanted.map((x) =>
    x ? { text: "" + x, n: x } : undefined
  );
  if (current > 1) {
    rc.unshift({ text: "prev", n: current - 1 });
  }
  if (current < max) {
    rc.push({ text: "next", n: current + 1 });
  }
  return rc;
}

export function getPageNavLinks(
  current: number,
  nTotal: number,
  pageSize: number,
  href: (page: number) => string
): React.ReactElement[] {
  const max = Math.floor(nTotal / pageSize) + (nTotal % pageSize ? 1 : 0);
  const wanted = getPageNumbers(current, max);
  return getNavLinks(wanted, href, (n) => "go to page " + n, current, true);
}
