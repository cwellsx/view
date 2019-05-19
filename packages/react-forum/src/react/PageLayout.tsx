import React from 'react';
import "./PageLayout.css"
import { config } from "../config"
import { ReactComponent as Close } from "../icons/misc/Close_12x_16x.svg";
import { NavLink } from 'react-router-dom';

/*
  This module renders content into a page layout (e.g. into one or more columns of various widths).
  The Layout interface defines/contains the content to be layed out (and identifies which layout to use).
  Functions in the App and Pages module create instances of Layout, and pass them to the renderLayout method.
*/

export interface KeyedItem {
  element: React.ReactElement;
  key: string;
}

interface RightContent {
  element: React.ReactElement,
  width: string,
  showButtonLabel: string,
  visible: boolean
}

export interface Tab {
  navlink: { href: string, text: string }; // becomes a Navlink instance
  content: ReadonlyArray<KeyedItem> | React.ReactElement;
}

export interface Tabs {
  style: "Discussion" | "List" | "Profile";
  header?: { first: React.ReactElement, next: React.ReactElement }; // required when style === "Profile"
  selected: number; // index into tabbed
  tabbed: Tab[];
}

function isTabs(content: MainContent): content is Tabs {
  return (content as Tabs).tabbed !== undefined;
}

type MainContent = ReadonlyArray<KeyedItem> | React.ReactElement | Tabs | string;

export interface Layout {
  main: MainContent;
  width?: "Full" | "Grid";
  right?: RightContent;
  subtitle?: React.ReactElement;
};

/*
  Implementation details
*/

export const loadingContents = { main: "Loading..." };

function setTitle(title: string): void {
  document.title = `${title} - ${config.appname}`;
}

function renderMainColumn(main: MainContent) {
  if (Array.isArray(main)) {
    return (
      main.map((x) =>
        <div className="element" key={x.key}>
          {x.element}
        </div>
      )
    );
  }
  if (!isTabs(main)) {
    return (
      <div className="element">
        {main}
      </div>
    );
  }
  return renderTabs(main);
}

function renderTabs(main: Tabs) {
  const style = main.style;
  const isProfile = (style === "Profile");
  const className = (!isProfile) ? "tab-head" : "tab-head profile";
  return (
    <React.Fragment>
      <div className={className}>
        <div className="tabs">
          {main.tabbed.map((tab, index) =>
            <NavLink
              to={tab.navlink.href}
              key={"" + index}
              className={(index === main.selected) ? "selected" : undefined}>
              {tab.navlink.text}
            </NavLink>)}
        </div>
      </div>
      <div className="tabbed">
        {main.tabbed.map((tab, index) => {
          return (
            <div className={(index !== main.selected) ? "hidden" : undefined} key={"" + index}>
              {tab.content}
            </div>
          );
        })
        }
      </div>
    </React.Fragment>
  );
}

function renderRightColumn(right?: RightContent) {
  if (!right) {
    return { rightColumn: null, rightButton: null };
  }

  const refDiv = React.createRef<HTMLDivElement>();
  const refButton = React.createRef<HTMLButtonElement>();

  function hideOrShow(show: boolean) {
    const boundDiv = refDiv.current;
    const boundButton = refButton.current;
    if (!boundDiv || !boundButton) {
      return;
    }
    if (show) {
      boundDiv.classList.remove("hidden");
      boundButton.classList.add("hidden");
    } else {
      boundDiv.classList.add("hidden");
      boundButton.classList.remove("hidden");
    }
  }
  function handleShowDiv(event: React.MouseEvent<HTMLButtonElement>): void {
    hideOrShow(true);
    event.preventDefault();
  }
  function handleHideDiv(event: React.MouseEvent<HTMLButtonElement>): void {
    hideOrShow(false);
    event.preventDefault();
  }

  function className(name: string, visible: boolean) {
    return (visible) ? name : (name + " hidden");
  }

  const rightButton = (
    <button className={className("column-right-button", !right.visible)} type="button" onClick={handleShowDiv} ref={refButton}>
      {right.showButtonLabel}
    </button>
  );

  const closeButton = (
    <button className="column-close-button" type="button" onClick={handleHideDiv} title="Close">
      <Close viewBox="0 0 16 16" width="16" height="16" />
    </button>
  );

  const rightColumn = (
    <div className={className("column-right", right.visible)} style={{ width: right.width }} ref={refDiv} >
      {closeButton}
      {right.element}
    </div>
  );

  return { rightColumn, rightButton };
}

function switchLayout(contents: Layout, title: string) {
  const mainColumn = renderMainColumn(contents.main);
  const { rightColumn, rightButton } = renderRightColumn(contents.right);

  const className = !contents.width
    ? "column-text"
    : (contents.width === "Grid")
      ? "column-text grid"
      : "column-wide";

  if (isTabs(contents.main) && (contents.main.style === "Profile")) {
    // tabs are located above the header and the header is inside the first tab
    return (
      <div className={className}>
        {mainColumn}
      </div>
    );
  }

  switch (className) {
    case "column-text":
    case "column-text grid":
      return (
        <React.Fragment>
          <div className={className}>
            {rightButton}
            <div className="header">
              <h1>{title}</h1>
              {contents.subtitle}
            </div>
            <div className="content">
              {mainColumn}
            </div>
          </div>
          {rightColumn}
        </React.Fragment>
      );
    case "column-wide":
      return (
        <React.Fragment>
          <div className="column-wide">
            {rightButton}
            {mainColumn}
          </div>
          {rightColumn}
        </React.Fragment>
      );
    default:
      throw new Error();
  }
}

export const renderLayout = (title: string, layout: Layout): React.ReactElement => {
  setTitle(title);
  const contents = switchLayout(layout, title);
  return (
    <div className="all-columns">
      {contents}
    </div>
  );
}
