import React from "react";
import { RouteComponentProps, Link } from "react-router-dom";
import { Api, Url, Data, toHtml } from "client";
import { useFetchApi2 } from "../hooks";
import { getPage, FetchedT, ShowDataT, Layout } from "../layouts";
import { notFound } from "./NotFound";
import { History } from "history";
import { EditTagInfo } from "../Editor";
import { getDiscussionsSubtitle } from "../components";

export const Tag: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const info = Url.isTagInfo(props.location);
  if (!Url.isParserError(info)) {
    return <TagId tag={info.key} word="info" history={props.history} />;
  }
  const edit = Url.isTagEdit(props.location);
  if (!Url.isParserError(edit)) {
    return <TagId tag={edit.key} word="edit" history={props.history} />;
  }
  return notFound(props);
};

type TagIdProps = Url.InfoOrEdit & { history: History; tag: string };
const TagId: React.FunctionComponent<TagIdProps> = (props: TagIdProps) => {
  const { tag, word, history } = props;

  // include word as a dependency because we want to re-render if word changes,
  // even though { word } isn't required in the TParam parameter passed to useGetLayout2
  const key: Data.Key & Url.InfoOrEdit = React.useMemo(() => {
    return { key: tag, word };
  }, [tag, word]);

  const showData: ShowDataT<Data.TagInfo, void> = (fetched: FetchedT<Data.TagInfo, void>) =>
    showTag(fetched, { word, history });
  return getPage(useFetchApi2(Api.getTag, key), showData);
};

type TagExtra = Url.InfoOrEdit & { history: History };
function showTag(fetched: FetchedT<Data.TagInfo, void>, extra: TagExtra): Layout {
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
    word === "edit" ? (
      <EditTagInfo tag={data.key} history={extra.history} summary={data.summary} markdown={data.markdown} />
    ) : (
      infoContent()
    );
  const layout: Layout = {
    main: { content, title, subtitle },
    width: "None",
  };
  return layout;
}
