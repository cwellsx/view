import React from "react";

export interface KeyedItem {
  element: React.ReactElement;
  key: string;
}

// shown in the main column of the page, either a single element, or an array of elements shown as a list
export type MainContent = ReadonlyArray<KeyedItem> | React.ReactElement | string;

// optional content shown in a column to the right of the page; if present the right column can be shown or hidden
export interface RightContent {
  element: React.ReactElement;
  width: string;
  showButtonLabel: string; // label on the button which is used to show or hide the column
  visible: boolean;
}

// used e.g. for the user profile page, which has "Profile", "Edit", and "Activity" tabs
export interface Tab {
  navlink: { href: string; text: string }; // becomes a Navlink instance
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
  tabs: { href: string; text: string }[]; // becomes a Navlink instance
}

// specifies the width of the main column
export type Width =
  | "Full" // wide screen, no title, e.g. for images
  | "Grid" // semi-wide grid e.g. for the lists of tags and user names, which are displayed as a grid
  | "Closed" // semi-narrow text where horizontal rule touches vertical, e.g. for lists and site map
  | "Open" // like "Closed" except horizontal rule doesn't touch vertical, e.g. for messages in a discussion
  | "None"; // like "Closed" except no horizontal rule, e.g. for new discussion

export interface Layout {
  main:
    | Tabs
    | {
        title: string;
        subtitle?: React.ReactElement;
        footer?: React.ReactElement;
        content: MainContent;
        subTabs?: SubTabs; // feasible when MainContent is ReadonlyArray<KeyedItem>
      };
  width: Width;
  right?: RightContent;
}
