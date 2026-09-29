export class TemporaryPhotos {
  private uses = new Map<string, number>();
  private discarded = new Set<string>();
  private readonly remove: (uri: string) => void;

  constructor(remove: (uri: string) => void) {
    this.remove = remove;
  }

  retain(uri: string): void {
    this.uses.set(uri, (this.uses.get(uri) ?? 0) + 1);
  }

  release(uri: string): void {
    const remaining = (this.uses.get(uri) ?? 0) - 1;
    if (remaining > 0) this.uses.set(uri, remaining);
    else this.uses.delete(uri);
    this.removeIfUnused(uri);
  }

  discard(uri: string): void {
    this.discarded.add(uri);
    this.removeIfUnused(uri);
  }

  private removeIfUnused(uri: string): void {
    if (!this.discarded.has(uri) || this.uses.has(uri)) return;
    this.discarded.delete(uri);
    this.remove(uri);
  }
}
