import * as R from "../shared/urls";

/*
  In future, add code to load old state from disk and to save new state to disk.

  For now, when the server is runnning inside the browser as a demo, the session state is volatile --
  i.e. it's written here, but lost if the React application is reloaded.
*/

interface SessionState {
  discussions?: {
    sort?: R.DiscussionsSort;
    pagesize?: R.PageSize;
  };
  discussion?: {
    sort?: R.DiscussionSort;
  };
}

const sessionData: Map<number, SessionState> = new Map<number, SessionState>();

function getOrSet(userId: number): SessionState {
  let sessionState = sessionData.get(userId);
  if (!sessionState) {
    sessionState = {};
    sessionData.set(userId, sessionState);
  }
  return sessionState;
}

export function getSetDiscussionsOptions(userId: number, options: R.DiscussionsOptions) {
  const sessionState = getOrSet(userId);
  // write any new explicitly-set options to the session state
  if (options.sort || options.pagesize) {
    let stored = sessionState.discussions;
    if (!stored) {
      stored = {};
      sessionState.discussions = stored;
    }
    if (options.sort) {
      stored.sort = options.sort;
    }
    if (options.pagesize) {
      stored.pagesize = options.pagesize;
    }
  }
  // get any old options from the session state
  const old = sessionState.discussions;
  if (old) {
    if (old.sort) {
      options.sort = old.sort;
    }
    if (old.pagesize) {
      options.pagesize = old.pagesize;
    }
  }
}

export function getSetDiscussionOptions(userId: number, options: R.DiscussionOptions) {
  const sessionState = getOrSet(userId);
  // write any new explicitly-set options to the session state
  if (options.sort) {
    let stored = sessionState.discussion;
    if (!stored) {
      stored = {};
      sessionState.discussion = stored;
    }
    if (options.sort) {
      stored.sort = options.sort;
    }
  }
  // get any old options from the session state
  const old = sessionState.discussion;
  if (old) {
    if (old.sort) {
      options.sort = old.sort;
    }
  }
}
