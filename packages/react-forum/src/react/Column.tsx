import React, { FunctionComponent, ReactElement } from 'react';
import "./Column.css"

/*
  This passes content as ReactElement instances

  It could pass content as FunctionComponent instances instead, see
  https://stackoverflow.com/a/55963664/49942
*/

export interface Content {
  element: ReactElement;
  key: string;
}

interface Column {
  title: string;
  // content: FunctionComponent;
  contents: ReadonlyArray<Content>;
}

export const renderContentOne: FunctionComponent<Column> = (column: Column) => {
  const content = column.contents.map((x) =>
    <div className="element" key={x.key}>
      {x.element}
    </div>
  );
  return (
    <div className="column">
      <div className="header">
        <h1>{column.title}</h1>
      </div>
      <div className="content">
        {content}
      </div>
    </div>
  )
}
