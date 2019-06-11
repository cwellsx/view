# To Do

## Done

The following are complete, or at least well-begun.

### Architecture

- [x] React architecture
  - [x] Route URLs to different components for different pages
  - [x] Fetch different data from the server as required for each page
  - [x] Pages share a reusable, configurable, extensible common layout
  - [x] Pages share reusable common elements (simple components)
  - [x] Further components when needed for any more complex user interactions
  - [x] Some UI details, including "tabs", the sort-order and paging of lists
- [x] System architecture -- share data type definitions, between the React front-end and the server back-end
- [x] Server architecture -- implement the server's data types, and data processing

### Pages

I won't list components -- like the "Top-bar" and the "Editor" -- but here's a list of the pages that are now complete
(or they're at least implemented, and further functionality could be added):

- Site map
- Discussions
  - [x] List discussions
  - [x] Create new discussion
  - [x] View discussion
  - [x] Create new message within a discussion
- Users
  - [x] List users
  - [x] View user profile
  - [x] Edit profile and preferences
  - [x] View user activity

## To do

### Features

I won't list features that could be implemented, for example ...

- Let a user define "favourites"
- Let a user get "notifications"
- Define "user groups", "moderators", "reputation"
- Integration with 3rd-party systems and/or content

... you might see better than I can what further features you would desire.

### Infrastructure

But here is a list of some fundamental *architectural* components that I have yet to integrate:

- [ ] Web server -- I expect this would be the [Express](https://expressjs.com/) server.
  - Application-specific code to be run on the server is already written -- see the [`./src/server`](./src/server)
  subdirectory
  - What's needed is to do without the "mock" that's presently used in the [`./src/io`](./src/io) subdirectory
- [ ] Login -- need to implement user authentication, possibly using the [Passport](http://www.passportjs.org/) module
  -- and signup i.e. create new users
- [ ] Data storage -- need to store data on the server:
  - Possibly using [MongoDB](https://www.mongodb.com/) (which would make this a "MERN" application)
  - And/or perhaps using Amazon's [AWS S3](https://aws.amazon.com/s3/) file-storage
    (see also [here](https://devcenter.heroku.com/articles/s3))
- [ ] Email -- sending email might be necessary, if not for notifications then perhaps at least for password reset
- [ ] Push notifications -- assuming a user's page should update automatically, using data pushed from the server,
  e.g. when another user posts a new message, I expect this would be implemented using Ajax and/or WebSocket.
- [ ] Try adding [this](https://stackoverflow.com/a/50827450/49942) to see whether that enables support for IE (if IE is
required) -- I suspect React support IE, however I used slightly modern JavaScript like `Array.find` when I was coding
-- see also https://github.com/facebook/create-react-app/issues/4647
- [ ] There's currently client-side validation but not server-side validation, e.g. of an edited user profile, so a
  malicious client could post invalid changes (e.g. a user profile which deletes the user name).

### More

I'd like to do a little more before stopping, to make a good demo of the UI:

- Make the tags clickable, to support
  - Question tagged [tag]
  - Search questions for [user] tagged [tag]
  - Edit tag information
  - List of tags
- Validate the tags entered by the user
- Deploy to Heroku

- Use https://expressjs.com/en/api.html#res in mockSend and server/routes

More:

- Alter the page margins if it's small-screen
- Make `getExerpt` markdown-aware, e.g. remove images and ignore the length of hyperlinks
- Support writing to local storage -- https://github.com/donavon/use-dark-mode
- Use Sass to implement stylesheets -- https://facebook.github.io/create-react-app/docs/adding-a-sass-stylesheet