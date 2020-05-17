# React Forum

This is an experiment -- write a discussion forum, using React.
It is a "minimum viable" implementation, a proof of concept --
one could add more features, but the most essential are in place.

## UI for three types of data

Three types of data are displayed on more than ten different types of UI page listed here.

**Discussions**:

- List of [All discussions](/discussions) --
  the list can be sorted
  ("newest" means when it was created, or "active" means when its most recent message was posted);
  and, there's pagination (e.g. 30 or 50 items per page).
- Each discussion, [for example here](/discussions/1) --
  there's a text area at the end where you can post another answer.
- Start a [New discussion](/discussions/new) -- if you click the "Ask Question" button on that page,
  you'll see that the user's data entry is validated; and there's a tag editor, which displays existing tags as hints.

**Tags**:

- List of [All tags](/tags)
- [Discussions for each tag](/discussions/tagged/{tag})
- [Description of each tag](/tags/{tag}/info)
- And a page to [Edit the description](/tags/{tag}/edit)

**Users**:

- List of [All users](/users).
- For each specific user, three tabs:

  - [Profile](/users/1)
  - [Edit settings](/users/edit/1)
  - [Activity](/users/1?tab=activity)

  The data in a user profile is at the minimal end of "minimum viable" -- in practice the user data might be
  expanded, to support Favourites and Notifications, different user Privileges, or Teams, and so on.

## This is a UI demo with volatile (non-persistent) data

The current version of this demo runs the UI **and the server** inside your browser.

When you use the UI to create or edit data, the new data is saved in the 'server'
-- and you can see the change in the UI --
**but** the server is reloaded, and any changes you saved are lost, whenever you refresh the browser or reload the page.

When you navigate between UI pages (using the links on the page or on the application's top-bar),
the browser doesn't reload the page, nor the React scripts.

Instead, links are implemented with the
`react-router-dom` package, and the UI is
a "single-page application".
