// The only place the brand is drawn, so changing the logo is a one-file edit.
// PRD section 4: follow Instagram's layout but keep our own name and logo, so this is
// an original mark in a script style, not Instagram's trademarked wordmark or glyph.
export function BrandWordmark() {
  return <span className="brand-wordmark">Macgram</span>;
}

export function BrandGlyph() {
  return (
    <span aria-hidden="true" className="brand-glyph">
      M
    </span>
  );
}
