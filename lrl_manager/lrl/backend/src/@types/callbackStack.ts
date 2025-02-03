export class callbackStack {
  push(item: Function) {
    this.top = new stackItem(item, this.top);
  }
  pop(): Function {
    if (this.top !== null) {
      const item = this.top.item;
      this.top = this.top.next;
      return item;
    } else {
      return undefined;
    }
  }

  private top: stackItem;

  [Symbol.iterator]() {
    return {
      next: () => {
        return this.top !== null
          ? {
              done: false,
              value: this.pop(),
            }
          : { done: true };
      },
    };
  }

  constructor(item?: Function) {
    if (item) {
      this.top = new stackItem(item, null);
    } else {
      this.top = null;
    }
  }
}

class stackItem {
  item: Function;
  next: stackItem;
  constructor(item: Function, next?: stackItem) {
    this.item = item;
    this.next = next ? next : null;
  }
}
