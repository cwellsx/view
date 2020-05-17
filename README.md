I wrote this as an example of a application designed with React and TypeScript.

## Demo

A demo of the software is running at https://cwellsx.github.io/views/
-- try that to see how it behaves, and what it looks like.

## Source code

- [packages](./packages#readme) contains all the source code, including client and server packages
- [packages/ui-react](./packages/ui-react#readme) is the package which uses React to implement the client UI

## Design spec

As a requirement or design spec for this project I chose to implement Stack Overflow's user interface, because:

- It's non-trivial -- i.e. it's a "real-world" and not just a "hello world" example
- It's well-known -- a reference implementation exists -- so it's easy to assess how good an imitation this is

I implemented these core UI features:

- Discussions
  - List discussions (with sorting, filtering, and paging)
  - Create new discussion
  - View discussion
  - Create new message within a discussion
- Users
  - List users
  - View user profile
  - Edit profile and preferences
  - View user activity (with tags and topics)
- Tags
  - List tags
  - List discussions for each tag
  - View and edit tag summary and description
  - Select, edit, and create the tags associated with a question

## How to build

Clone this Git repository to your development machine, and run `yarn install` and `yarn build`.

For further details see [CONTRIBUTING](./CONTRIBUTING.md) and [MONOREPO](./MONOREPO.md).

## About the demo

The current version of the demo runs the UI **and the server** inside your browser.

The server uses an "in memory" database and doesn't persist to local storage.
When you use the UI to create or edit data, the new data is saved in the 'server'
-- and you can see the change in the UI --
**but** the server is reloaded, and any changes you saved are lost, whenever you refresh the browser or reload the page.

When you navigate between UI pages (using the links on the page or on the application's top-bar),
the browser doesn't reload the page, nor the React scripts.

Instead, links are implemented with the
[`react-router-dom`](https://reacttraining.com/react-router/web/guides/quick-start) package, and the UI is
[a single-page application](https://en.wikipedia.org/wiki/Single-page_application).

## Conclusion

I like using React:

- Nice tools -- including seamless integration between editing the source and browsing the result,
  and, VS Code's integration with TypeScript
- Organize the implementation, into modules, any way you like
- Minimal overhead, no "framework" to learn to fit into
- A wealth of 3rd-party components

TypeScript also seems ideal, for example:

- TypeScript interfaces can define the format of data shared between client and server
- Strong typing helps with refactoring and IntelliSence.
