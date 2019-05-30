import React from 'react';
import "./PageLayout.css"
import { config } from "../config"
import { ReactComponent as Close } from "../icons/material/baseline-close-24px.svg";
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

// shown in the main column of the page, either a single element, or an array of elements shown as a list
type MainContent = ReadonlyArray<KeyedItem> | React.ReactElement | string;

// optional content shown in a column to the right of the page; if present the right column can be shown or hidden
interface RightContent {
  element: React.ReactElement,
  width: string,
  showButtonLabel: string, // label on the button which is used to show or hide the column
  visible: boolean
}

// used e.g. for the user profile page, which has "Profile", "Edit", and "Activity" tabs
export interface Tab {
  navlink: { href: string, text: string }; // becomes a Navlink instance
  content: MainContent;
  subTabs?: SubTabs; // feasible when MainContent is ReadonlyArray<KeyedItem>
  slug?: React.ReactElement;
}
export interface Tabs {
  title: string; // sets document.title only ... the <h1> is in the tabbed content
  selected: number; // index into tabbed
  tabbed: Tab[];
}

// used e.g. for a discussion page, where you can sort the answers in either direction
// the "subtabs" are displays as tabs, below the first element (e.g. below the question which stared the discussion)
// or a "subtitle" is inserted into the heading above the first element, e.g. to display buttons on the discussions list
export interface SubTabs {
  text: string;
  selected: number; // index into tabbed
  tabs: { href: string, text: string }[]; // becomes a Navlink instance
}

// specifies the width of the main column
type Width = "Full" | // wide screen, no title, e.g. for images
  "Grid" | // semi-wide grid e.g. for the lists of tags and user names, which are displayed as a grid
  "Closed" | // semi-narrow text where horizontal rule touches vertical, e.g. for lists and site map
  "Open" | // like "Closed" except horizontal rule doesn't touch vertical, e.g. for messages in a discussion
  "None"; // like "Closed" except no horizontal rule, e.g. for new discussion

function isTabs(main: Tabs | any): main is Tabs {
  return (main as Tabs).tabbed !== undefined;
}

export interface Layout {
  main: Tabs | {
    title: string;
    subtitle?: React.ReactElement;
    content: MainContent;
    subTabs?: SubTabs; // feasible when MainContent is ReadonlyArray<KeyedItem>
  };
  width: Width;
  right?: RightContent;
};

/*
  Implementation details
*/

export const loadingContents: Layout = { main: { title: "Loading...", content: "..." }, width: "Closed" };

function setTitle(title: string): void {
  document.title = `${title} - ${config.appname}`;
}

function renderSubTabs(subTabs: SubTabs) {
  return (
    <div className="tab-head subtabs" key="subMenu">
      <div className="tabs">
        <h2>{subTabs.text}</h2>
        <div>
          {subTabs.tabs.map((tab, index) =>
            <NavLink to={tab.href} key={"" + index}
              className={(index === subTabs.selected) ? "selected" : undefined}>
              {tab.text}
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
}

function renderContent(content: MainContent, subTabs?: SubTabs) {
  if (Array.isArray(content)) {
    return (
      content.map((x, index) => {
        const subMenu = ((index === 1) && subTabs) ? renderSubTabs(subTabs) : undefined;
        const className = ((index === 0) && subTabs) ? "element first" : "element";
        return (
          <React.Fragment key={"" + index}>
            {subMenu}
            <div className={className} key={x.key}>
              {x.element}
            </div>
          </React.Fragment>
        );
      })
    );
  }
  return  content;
}

function renderTabs(main: Tabs, isTop: boolean) {
  const className = (!isTop) ? "tab-head" : "tab-head profile";
  const slug = main.tabbed[main.selected].slug;
  const slugDiv = !slug ? undefined : <div className="slug">{slug}</div>;
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
          {slugDiv}
        </div>
      </div>
      <div className="tabbed">
        {main.tabbed.map((tab, index) => {
          return (
            <div className={(index !== main.selected) ? "hidden" : undefined} key={"" + index}>
              {renderContent(tab.content, tab.subTabs)}
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
    <button className={className("column-right-button", !right.visible)}
      type="button" onClick={handleShowDiv} ref={refButton}>
      {right.showButtonLabel}
    </button>
  );

  const closeButton = (
    <button className="column-close-button" type="button" onClick={handleHideDiv} title="Close">
      <Close width="16" height="16" />
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

function switchLayout(layout: Layout) {
  const { rightColumn, rightButton } = renderRightColumn(layout.right);

  function getClassName(width: Width): string {
    switch (width) {
      case "Full": return "column-wide";
      case "Grid": return "column-text grid";
      case "Closed": return "column-text closed";
      case "Open": return "column-text open";
      case "None": return "column-text none";
      default: throw new Error("not implemented");
    }
  }
  const className = getClassName(layout.width);

  if (isTabs(layout.main)) {
    // tabs are located above the header and the header is inside the first tab
    setTitle(layout.main.title);
    return (
      <div className={className}>
        {renderTabs(layout.main, true)}
      </div>
    );
  }

  const mainColumn = renderContent(layout.main.content, layout.main.subTabs);
  setTitle(layout.main.title);

  const title = layout.main.subtitle ? layout.main.subtitle : <h1>{layout.main.title}</h1>;

  if (layout.width !== "Full") {
    return (
      <React.Fragment>
        <div className={className}>
          {rightButton}
          <div className="header">
            {title}
          </div>
          <div className="content">
            {mainColumn}
          </div>
        </div>
        {rightColumn}
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <div className={className}>
          {rightButton}
          {mainColumn}
        </div>
        {rightColumn}
      </React.Fragment>
    );
  }
}

export function useLayout(layout: Layout): React.ReactElement {
  const contents = switchLayout(layout);
  return (
    <div className="all-columns">
      {contents}
    </div>
  );
}
