// Only the latest request may update a screen, including after unmount.
export class RequestVersion {
  private version = 0;
  next(): () => boolean {
    const current = ++this.version;
    return () => current === this.version;
  }
  cancel(): void { this.version++; }
}
