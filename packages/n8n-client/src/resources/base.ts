/**
 * Bound resource snapshot wrapper.
 *
 * `data`, `toObject()`, and `toJSON()` always return defensive clones of the
 * last stored snapshot. Resource methods should keep that snapshot truthful:
 * use confirmed server DTOs when available, refresh after void mutations when
 * practical, and only merge compact response fields that the server actually
 * returned.
 */
export default abstract class BaseResource<TData> {
  constructor(private currentSnapshot: TData) {
    this.currentSnapshot = this.clone(currentSnapshot);
  }

  protected get snapshot(): TData {
    return this.currentSnapshot;
  }

  /**
   * Public snapshot exposed to callers.
   *
   * Most resources keep this as confirmed server state. Resources backed by
   * compact mutation responses may retain previously confirmed fields that the
   * server omitted from the latest response, but request-only fields should
   * never be merged into this snapshot.
   */
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
