/*
  This class tracks which is the next ID value to be assigned a new resource.
  Beware that it's difficult to do this if there are two server instances,
  then again the current implementation keeps the whole database in local cache.
*/

class Current {
  private value: number;
  constructor() {
    this.value = 0;
  }
  next() {
    return ++this.value;
  }
}

export class CurrentIds {
  userId: Current;
  discussionId: Current;
  messageId: Current;
  constructor() {
    this.userId = new Current();
    this.discussionId = new Current();
    this.messageId = new Current();
  }
}
