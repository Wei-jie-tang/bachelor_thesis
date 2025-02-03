export class callbackList {
  private head: listItem;
  private tail: listItem;

  add(item: Function) {
    if (this.head === null) {
      this.head = new listItem(item);
      this.tail = this.head;
    } else {
      this.tail.next = new listItem(item);
      this.tail = this.tail.next;
    }
  }

  [Symbol.iterator]() {
    return {
      current: this.head,

      next() {
        if (this.current !== null) {
          const value: Function = this.current.item;
          this.current = this.current.next;
          return {
            done: false,
            value,
          };
        } else {
          return { done: true };
        }
      },
    };
  }

  constructor(item?: Function) {
    if (item) {
      this.head = new listItem(item);
    } else {
      this.head = null;
    }
    this.tail = this.head;
  }
}

class listItem {
  item: Function;
  next: listItem;
  constructor(item: Function, next?: listItem) {
    this.item = item;
    this.next = next ? next : null;
  }
}
