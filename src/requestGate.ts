export type RequestKind = 'capture' | 'ocr';

export class RequestGate {
  private generation = 0;
  private active = true;
  private pending = new Map<RequestKind, number>();

  begin(kind: RequestKind): number | null {
    if (!this.active || this.pending.has(kind)) return null;
    const ticket = ++this.generation;
    this.pending.set(kind, ticket);
    return ticket;
  }

  isCurrent(kind: RequestKind, ticket: number): boolean {
    return this.active && this.pending.get(kind) === ticket;
  }

  finish(kind: RequestKind, ticket: number): void {
    if (this.pending.get(kind) === ticket) this.pending.delete(kind);
  }

  invalidate(): void {
    this.pending.clear();
  }

  setActive(active: boolean): void {
    this.active = active;
    if (!active) this.invalidate();
  }
}
