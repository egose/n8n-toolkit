export default abstract class BaseResource<TData> {
  constructor(private currentSnapshot: TData) {
    this.currentSnapshot = this.clone(currentSnapshot);
  }

  protected get snapshot(): TData {
    return this.currentSnapshot;
  }

  get data(): TData {
    return this.clone(this.currentSnapshot);
  }

  toObject(): TData {
    return this.clone(this.currentSnapshot);
  }

  toJSON(): TData {
    return this.toObject();
  }

  protected replaceSnapshot(data: TData): this {
    this.currentSnapshot = this.clone(data);
    return this;
  }

  protected mergeSnapshot(data: Partial<TData>): this {
    this.currentSnapshot = this.clone({ ...this.currentSnapshot, ...data });
    return this;
  }

  private clone<TValue>(value: TValue): TValue {
    return structuredClone(value);
  }
}
