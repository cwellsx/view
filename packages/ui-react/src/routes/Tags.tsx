import React from "react";
import { RouteComponentProps, NavLink, Link } from "react-router-dom";
import { Api, Url, Data, SearchInput, config } from "client";
import { useFetchApi2 } from "../hooks";
import { getPage, FetchedT, Layout } from "../layouts";
import { notFound } from "./NotFound";
import { getPageNavLinks, getTagLink } from "../components";
import * as Icon from "../icons";
import { ThrottledInput } from "../components";

export const Tags: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  // get the options
  const options = Url.isTagsOptions(props.location);
  if (Url.isParserError(options)) {
    return notFound(props, options.error);
  }
  return <TagsList sort={options.sort} pagesize={options.pagesize} page={options.page} />;
};

const TagsList: React.FunctionComponent<Url.TagsOptions> = (props: Url.TagsOptions) => {
  const { sort, pagesize, page } = props;
  const options: Url.TagsOptions = React.useMemo(() => {
    return { sort, pagesize, page };
  }, [sort, pagesize, page]);

  return getPage(useFetchApi2(Api.getTags, options), showTags);
};

function showTags(fetched: FetchedT<Data.Tags, SearchInput>): Layout {
  const { data, newData } = fetched;
  const { range, tagCounts } = data;
  const title = config.strTags;

  // the header (subtitle) and footer are like (copy-and-pasted) those from the Discussions page

  const search = (
    <div className="search">
      <ThrottledInput api={newData} placeholder="Filter by tag name" />
      <Icon.Search />
    </div>
  );

  const subtitle = (
    <React.Fragment>
      <div className="minigrid">
        <h1>{title}</h1>
      </div>
      <div className="minigrid subtitle">
        <div className="count">{search}</div>
        <div className="sort">
          <NavLink
            to={Url.getTagsOptionsUrl({ sort: "Popular" })}
            className={range.sort === "Popular" ? "selected" : undefined}
          >
            Popular
          </NavLink>
          <NavLink
            to={Url.getTagsOptionsUrl({ sort: "Name" })}
            className={range.sort === "Name" ? "selected" : undefined}
          >
            Name
          </NavLink>
        </div>
      </div>
    </React.Fragment>
  );

  const footer = (
    <React.Fragment>
      <div className="minigrid footer">
        <div className="page"></div>
        <div className="page">
          {getPageNavLinks(range.pageNumber, range.nTotal, range.pageSize, (page) =>
            Url.getTagsOptionsUrl({ page, sort: range.sort })
          )}
        </div>
      </div>
    </React.Fragment>
  );

  function getTagInfo(tagCount: Data.TagCount) {
    // similar to the ShowHint function in EditorTags.tsx
    const key = tagCount.key;
    const tag = getTagLink(tagCount);
    const count = tagCount.count ? <span className="multiplier">×&nbsp;{tagCount.count}</span> : undefined;
    const summary = tagCount.summary ? <div className="exerpt">{tagCount.summary}</div> : undefined;
    const edit = (
      <div>
        <Link className="edit-link" to={Url.getTagEditUrl({ key })}>
          edit
        </Link>
      </div>
    );

    return (
      <div className="tag-info" key={key}>
        {tag}
        {count}
        {summary}
        {edit}
      </div>
    );
  }

  // the content is like that of the User page
  const contentTags: React.ReactElement = (
    <div className="all-tags">
      {tagCounts.map((tagCount) => {
        return getTagInfo(tagCount);
      })}
    </div>
  );

  return {
    main: { content: contentTags, title, subtitle, footer },
    width: "Grid",
  };
}
