export default abstract class BaseResource<TData> {
  constructor(private snapshot: TData) {}

  get data(): TData {
    return this.snapshot;
  }

  toObject(): TData {
    return this.snapshot;
  }

  toJSON(): TData {
    return this.toObject();
  }

  protected replaceSnapshot(data: TData): this {
    this.snapshot = data;
    return this;
  }

  protected mergeSnapshot(data: Partial<TData>): this {
    this.snapshot = { ...this.snapshot, ...data };
    return this;
  }
}
