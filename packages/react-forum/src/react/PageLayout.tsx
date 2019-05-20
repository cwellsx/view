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
  slug?: React.ReactElement;
}

export interface Tabs {
  title: string; // sets document.title only ... the <h1> is in the tabbed content
  selected: number; // index into tabbed
  tabbed: Tab[];
}

export interface SubTabs {
  text: string;
  selected: number; // index into tabbed
  tabs: { href: string, text: string }[]; // becomes a Navlink instance
}

function isTabs(main: Tabs | any): main is Tabs {
  return (main as Tabs).tabbed !== undefined;
}

type MainContent = ReadonlyArray<KeyedItem> | React.ReactElement | string;

export interface Layout {
  main: Tabs | {
    title: string;
    subtitle?: React.ReactElement;
    content: MainContent;
    subTabs?: SubTabs; // feasible when MainContent is ReadonlyArray<KeyedItem>
  };
  width?: "Full" | "Grid";
  right?: RightContent;
};

/*
  Implementation details
*/

export const loadingContents: Layout = { main: { title: "Loading...", content: "..." } };

function setTitle(title: string): void {
  document.title = `${title} - ${config.appname}`;
}

function renderSubTabs(subTabs: SubTabs) {
  return (
    <div className="tab-head subtabs" key="subMenu">
      <div className="tabs">
        <h2>{subTabs.text}</h2>
        {subTabs.tabs.map((tab, index) =>
          <NavLink to={tab.href} key={"" + index}
            className={(index === subTabs.selected) ? "selected" : undefined}>
            {tab.text}
          </NavLink>
        )}
      </div>
    </div>
  );
}

function renderMainContent(mainContent: MainContent, subTabs?: SubTabs) {
  if (Array.isArray(mainContent)) {
    return (
      mainContent.map((x, index) => {
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
  return (
    <div className="element">
      {mainContent}
    </div>
  );
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

function switchLayout(layout: Layout) {
  const { rightColumn, rightButton } = renderRightColumn(layout.right);

  const className = !layout.width
    ? "column-text"
    : (layout.width === "Grid")
      ? "column-text grid"
      : "column-wide";

  if (isTabs(layout.main)) {
    // tabs are located above the header and the header is inside the first tab
    setTitle(layout.main.title);
    return (
      <div className={className}>
        {renderTabs(layout.main, true)}
      </div>
    );
  }

  const mainColumn = renderMainContent(layout.main.content, layout.main.subTabs);
  setTitle(layout.main.title);

  switch (className) {
    case "column-text":
    case "column-text grid":
      return (
        <React.Fragment>
          <div className={className}>
            {rightButton}
            <div className="header">
              <h1>{layout.main.title}</h1>
              {layout.main.subtitle}
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

export function renderLayout(layout: Layout): React.ReactElement {
  const contents = switchLayout(layout);
  return (
    <div className="all-columns">
      {contents}
    </div>
  );
}
