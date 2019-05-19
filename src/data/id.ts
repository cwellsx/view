/*
  Most things -- e.g. users and discussions -- are identified (to the system) by a numeric Id, and (to users) by a name.

  Messages (within a discussion) are identified by a numeric Id but no name
  (though they have other properties too e.g. author and date).

  Tags are identified -- to the system and to users -- by a readable key string without a numeric Id.
*/

export interface IdName {
  id: number,
  name: string
};

export interface Key {
  key: string;
}
