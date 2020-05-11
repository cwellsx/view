import React from "react";
import "ui-assets/css/PageLayout.css";
import { config } from "client";
import * as Icon from "../icons";
import { NavLink } from "react-router-dom";

import { Layout, Tabs, SubTabs, RightContent } from "./Layout";
import type { MainContent, Width } from "./Layout";

/*
  Implementation details
*/

function setTitle(title: string): void {
  document.title = `${title} - ${config.appname}`;
}

function renderSubTabs(subTabs: SubTabs) {
  return (
    <div className="tab-head subtabs" key="subMenu">
      <div className="tabs">
        <h2>{subTabs.text}</h2>
        <div>
          {subTabs.tabs.map((tab, index) => (
            <NavLink to={tab.href} key={"" + index} className={index === subTabs.selected ? "selected" : undefined}>
              {tab.text}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderContent(content: MainContent, subTabs?: SubTabs, footer?: React.ReactElement) {
  if (Array.isArray(content)) {
    const elements = content.map((x, index) => {
      const subMenu = index === 1 && subTabs ? renderSubTabs(subTabs) : undefined;
      const className = index === 0 && subTabs ? "element first" : "element";
      return (
        <React.Fragment key={"" + index}>
          {subMenu}
          <div className={className} key={x.key}>
            {x.element}
          </div>
        </React.Fragment>
      );
    });
    return !footer ? (
      elements
    ) : (
      <React.Fragment>
        {elements}
        <div className="element" key="footer">
          {footer}
        </div>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {content}
      {footer}
    </React.Fragment>
  );
}

function renderTabs(main: Tabs, isTop: boolean) {
  const className = !isTop ? "tab-head" : "tab-head profile";
  const slug = main.tabbed[main.selected].slug;
  const slugDiv = !slug ? undefined : <div className="slug">{slug}</div>;
  return (
    <React.Fragment>
      <div className={className}>
        <div className="tabs">
          {main.tabbed.map((tab, index) => (
            <NavLink
              to={tab.navlink.href}
              key={"" + index}
              className={index === main.selected ? "selected" : undefined}
            >
              {tab.navlink.text}
            </NavLink>
          ))}
          {slugDiv}
        </div>
      </div>
      <div className="tabbed">
        {main.tabbed.map((tab, index) => {
          return (
            <div className={index !== main.selected ? "hidden" : undefined} key={"" + index}>
              {renderContent(tab.content, tab.subTabs)}
            </div>
          );
        })}
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
    return visible ? name : name + " hidden";
  }

  const rightButton = (
    <button
      className={className("column-right-button", !right.visible)}
      type="button"
      onClick={handleShowDiv}
      ref={refButton}
    >
      {right.showButtonLabel}
    </button>
  );

  const closeButton = (
    <button className="column-close-button" type="button" onClick={handleHideDiv} title="Close">
      <Icon.Close width="16" height="16" />
    </button>
  );

  const rightColumn = (
    <div className={className("column-right", right.visible)} style={{ width: right.width }} ref={refDiv}>
      {closeButton}
      {right.element}
    </div>
  );

  return { rightColumn, rightButton };
}

function isTabs(main: Tabs | any): main is Tabs {
  return (main as Tabs).tabbed !== undefined;
}

function switchLayout(layout: Layout) {
  const { rightColumn, rightButton } = renderRightColumn(layout.right);

  function getClassName(width: Width): string {
    switch (width) {
      case "Full":
        return "column-wide";
      case "Grid":
        return "column-text grid";
      case "Closed":
        return "column-text closed";
      case "Open":
        return "column-text open";
      case "None":
        return "column-text none";
      default:
        throw new Error("not implemented");
    }
  }
  const className = getClassName(layout.width);

  if (isTabs(layout.main)) {
    // tabs are located above the header and the header is inside the first tab
    setTitle(layout.main.title);
    return <div className={className}>{renderTabs(layout.main, true)}</div>;
  }

  const mainColumn = renderContent(layout.main.content, layout.main.subTabs, layout.main.footer);
  setTitle(layout.main.title);

  const title = layout.main.subtitle ? layout.main.subtitle : <h1>{layout.main.title}</h1>;

  if (layout.width !== "Full") {
    return (
      <React.Fragment>
        <div className={className}>
          {rightButton}
          <div className="header">{title}</div>
          <div className="content">{mainColumn}</div>
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
  return <div className="all-columns">{contents}</div>;
}

export function renderLayout(layout: Layout): React.ReactElement {
  const contents = switchLayout(layout);
  return <div className="all-columns">{contents}</div>;
}
