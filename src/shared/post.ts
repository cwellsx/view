// the interfaces in this module declare the type of data posted to the server
// and used as input parameters in the functions of the ../io/index module.

export interface Login {
  userName: string,
  password: string
}

export interface NewUser {
  name: string;
  email: string;
}

export interface EditUserProfile {
  name?: string;
  email?: string;
  location?: string;
  aboutMe?: string; // markdown
}

export interface NewTopic {
  title: string;
  summary?: string;
  markdown?: string;
}

// there's a discussionId as well but it's carried in the URL
export interface NewMessage {
  markdown: string;
}

export interface NewDiscussion {
  title: string;
  markdown: string;
  tags: string[];
}

// these are the <component>/<verb> paris which may be stored in the `post` member of the `Resource` instance
export type PostUrls = "answer/submit";
