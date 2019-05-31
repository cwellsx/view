# React components

This directory contains all the React components
(except there's one file, [`/src/index.tsx`](../index.tsx), in the root of the `/src` directory).

All other directories contain non-React TypeScript code
(e.g. to define the server, and utilities and data interfaces shared with the server).
There's currently slightly more React code than non-React is this project.

## Main files and typical data flow

The most important files, and the sequence in which data is fetched and processed, in this project are as follows.

### [`/src/react/App.tsx`](./App.tsx)

1. [`App.tsx`](./App.tsx) defines the routes (i.e. the URLs expected), and maps them to components.

   For example, the `/discussions` URL is mapped to a function component named
  `Discussions` (still within `App.tsx`).

2. The function component identifies a pair of functions:

   - An I/O function (e.g. named `IO.getDiscussions`) to get data from the server
   - Another function component (e.g. named `Page.Discussions`) to render that data after it's fetched

   The pair is passed to a custom hook (named `useGetLayout`, still within `App.tsx`).

3. The custom hook does the following:

   - Uses the `useEffect` hook to invoke the I/O function -- but only once
   - Before the I/O function has completed, it passes `loadingContents` to the `useLayout` function
   - After the I/O function has completed, it passes the data (fetched from the server) to the "Page" function
     (by pushing data into the `setState` function which causes a re-render)

   TypeScript template parameters ensure that the type of data fetched from the server matches the type of data
   expected as an input parameter to the "Page" function -- for example:
   
   - The `IO.getDiscussions` function returns data of type `Promise<I.Discussions>`.
   - The `Page.Discussions` function expects `data: I.Discussions` as its input parameter.

### [`/src/io/index.ts`](../io/index.ts)

4. The "IO" function fetches data from the server, and returns a `Promise<T>`.

   It gets data via the `fetch` API.

   As a configuration option it can use a `mockFetch` function with the same API (and return type) as `fetch`,
   except that the `mockFetch` implementation gets its data by making a subroutine call into a copy of the server
   that built-in to be resident in the browser.

### [`/src/react/Pages.tsx`](./Pages.tsx) 

5. The `useEffect` custom hooks passes the returned data as an input parameter to the "Page" function.

   The "Page" function creates React elements from the data (i.e. to display the data), 
   and stores and returns them in an interface named `Layout`.

### [`/src/react/Components.tsx`](./Components.tsx)

6. The "Page" function may call function defined in the `Components` module.

   These define various small, reusable components which may exist in various pages --
   e.g. the "gravatars" which are used as a signature for messages, for discussion summaries, on the user profile, etc.

### [`/src/react/PageLayout.tsx`](./PageLayout.tsx) 

7. The `Layout` interface is defined in the `PageLayout` module.
   It acts as the module's public interface, because it's the input data passed to that module's only exported function,
   which is named `useLayout`.

   This module acts as a "master page" to ensure that different pages have similar layout.

### Summary

In reverse chronological order, starting with the final step:

1. Page layout -- rendered by the `PageLayout` module, using content elements passed to it within the `Layout` interface
2. Page content -- rendered into a `Layout` instance by the `Page` module, using data passed to it from the custom hook

   Components are invoked as needed, as subroutines of the `Page` module

3. Custom hook -- gets a data promise from the server, then calls a Page function to convert that to a `Layout`
   instance, and uses that to invoke the page layout
4. Routes defined in the App -- coordinate by defining, for each URL or "route", a correct pair of "I/O function" plus
   "Page function" to the custom hook.

## Almost all pages are defined in the `Pages.tsx` module

The functions which renders each of the various pages are most all in the same [`Pages.tsx`](./Pages.tsx) module.

They're not strictly React "function components" because they return a `Layout` interface, not just a `ReactElement`.

I like to see them all in the same module (source file), because they're not especially long and because they all have
a similar structure (e.g. they all they return a `Layout` interface):

- When implementing a new page it's easy to see, copy, and refactor from the implementations of previous similar pages.
- When adding new capability to the "page layout" module, by expanding or redefining the `Layout` interface, it may be
  convenient to see all the page definitions (which return a `Layout` interface) defined in one module.

It would of course be possible to extract the "page" function from the `Pages.tsx` module,
into a separate module for each page.

## Other files in the `/react` folder

In addition to the files described above, some other files in the `/src/react` directory define function components,
which are too large to belong in the the `Components` module (which was intended as a library of small components),
and/or which are special or unusual (exceptional) in some way.

These include:

- [`AppContext.tsx`](./AppContext.tsx) -- used to propagate the identity of the currently-logged-in-user, from the
  `App` at the top down to any function component that may need it, without having to pass it as an explicit parameter.
- [`Editor.tsx`](./Editor.tsx) -- this is a thin wrapper around the 3rd-party
  [`pagedown-editor`](https://www.npmjs.com/package/pagedown-editor) module
  (see also [`pagedown`](https://github.com/StackExchange/pagedown))
- [`EditorTags.tsx`](./EditorTags.tsx) -- this is a surprisingly large component, which lets users create or edit the
  tags associated with a discussion (it has its own read-me, see [EDITORTAGS.md](./EDITORTAGS.md))
- [`ErrorMessage.tsx`](./ErrorMessage.tsx) -- this is a tiny component to display an error message on a page
  (invisible when there is no error message to display)
- [`Login.tsx`](./Login.tsx) -- this is a place-holder for a Login form
- [`Topbar.tsx`](./Topbar.tsx) -- this defines the navigation top-bar at the top of every page
  (the App includes it at the top of every page).

