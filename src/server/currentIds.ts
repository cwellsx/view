/*
  This class tracks which is the next ID value to be assigned a new resource.
  Beware that it's difficult to do this if there are two server instances,
  then again the current implementation keeps the whole database in local cache.
*/

export class FoundId {
  private value: number = 0;

  found(value: number) {
    if (value > this.value) {
      this.value = value;
    }
  }
  get current() {
    return this.value;
  }
}

class Current {
  private value: number;
  constructor(found: FoundId) {
    this.value = found.current;
  }
  next() {
    return ++this.value;
  }
}

export class CurrentIds {
  discussionId: Current;
  messageId: Current;
  constructor(discussionIds: FoundId, messageIds: FoundId) {
    this.discussionId = new Current(discussionIds);
    this.messageId = new Current(messageIds);
  }
}
