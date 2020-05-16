This is example software written using React.js and TypeScript.

A demo of the software is running at https://cwellsx.github.io/views/
-- try that to see how it behaves, and what it looks like.

## Why

I wrote this to see how to design an application using React.

The React API documentation shows mostly only small code examples,
each a half-a-dozen lines of code -- this larger project shows an example of how to implement:

- An application
  -- [`./packages/ui-react/src/App.tsx`](./packages/ui-react/src/App.tsx)
- Something like a "master page template"
  -- i.e. where different pages share similar layouts with different content
- A very interactive component
  -- [`./packages/ui-react/src/components/EditorTags.tsx`](./packages/ui-react/src/components/EDITORTAGS.md)
- A Single Page Application
  -- by including the data, and a "mock" version of the server, in the code that's run inside the browser.

As a requirement or design spec for this project I chose to implement Stack Overflow's user interface, because:

- It's non-trivial -- i.e. it's a "real-world" and not just a "hello world" example
- Its UI design is already completely specified, and doesn't look bad
- It's well-known -- a reference implementation exists -- so it's easy to assess how good an imitation this is

Many of the essential features are implemented:

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

## Conclusion

React seems like a good way to write an application:

- Nice tools -- including seamless integration between editing the source and browsing the result,
  and, VS Code's integration with TypeScript
- Organize the implementation, into modules, any way you like
- Minimal overhead, no "framework" to learn to fit into
- A wealth of 3rd-party components

It's also an adequate way to write some highly-interactive components.

Using it with TypeScript also seems ideal -- for example,
using TypeScript interfaces to define the format of data shared between client and server.
Strong typing helps when refactoring too.
