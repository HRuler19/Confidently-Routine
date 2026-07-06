// Minimal, safe Markdown-lite renderer for note content. A small hand-rolled
// subset (bold/italic/code/links/lists/headings) instead of a third-party
// parser - note content is short, and escaping HTML before layering on our
// own trusted tags means user text (including anything from an imported
// backup file) can never inject arbitrary markup.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SAFE_URL = /^(https?:|mailto:)/i;

function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+?)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) =>
    SAFE_URL.test(url) ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>` : match,
  );
  return out;
}

/** Converts note content to a small, trusted HTML subset for display. */
export function renderMarkdown(source: string): string {
  const lines = source.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);

    if (bullet) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInline(bullet[1])}</li>`);
      continue;
    }
    closeList();

    if (heading) {
      const level = heading[1].length + 2; // h3-h5, so notes never outsize page headings
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
    } else if (line !== "") {
      html.push(`<p>${renderInline(line)}</p>`);
    }
  }
  closeList();

  return html.join("");
}
