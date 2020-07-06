import { Data, toHtml, Url } from 'client/src';
import React from 'react';

import { getDiscussionsSubtitle, Link } from '../components';
import { EditTagInfo } from '../forms';
import { FetchedT, Layout } from '../layouts';

export function showTag(fetched: FetchedT<Data.TagInfo, void>, extra: Url.InfoOrEdit): Layout {
  const { data } = fetched;
  const { word } = extra;

  const title = word === "edit" ? `Editing tag info for '${data.key}'` : `About '${data.key}'`;

  const subtitle = word === "edit" ? undefined : getDiscussionsSubtitle(title, "Tag Info", data, "info");

  function infoContent() {
    const summary = data.summary ? data.summary : "There is no summary for this tag … yet!";
    const markdown = data.markdown ? (
      <div dangerouslySetInnerHTML={toHtml(data.markdown)}></div>
    ) : (
      <div className="summary none">{"There is no information for this tag … yet!"}</div>
    );
    const buttonText = !!data.summary && !!data.markdown ? "Edit Tag info" : "Create Tag Info";
    return (
      <div className="tag-wiki">
        <div className="summary">{summary}</div>
        {markdown}
        <div className="link">
          <Link to={Url.getTagEditUrl(data)} className="linkbutton">
            {buttonText}
          </Link>
        </div>
      </div>
    );
  }

  const content =
    word === "edit" ? <EditTagInfo tag={data.key} summary={data.summary} markdown={data.markdown} /> : infoContent();
  const layout: Layout = {
    main: { content, title, subtitle },
    width: "None",
  };
  return layout;
}
