/**
 * Slalom — alternating media + text section.
 * Expected authored structure (2 rows):
 *   row 1: text content (heading, paragraph(s), optional CTA)
 *   row 2: image
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [textRow, mediaRow] = rows;

  if (textRow) {
    textRow.classList.add('slalom-text');
    // Standalone CTA links render as the MongoDB arrow text-link (secondary):
    // a single <a> that is the sole content of its <p> or cell <div>.
    textRow.querySelectorAll('p > a:only-child, div > a:only-child').forEach((a) => {
      if (a.parentElement.textContent.trim() !== a.textContent.trim()) return;
      a.classList.add('button', 'secondary');
      a.parentElement.classList.add('button-container');
    });
  }
  if (mediaRow) mediaRow.classList.add('slalom-media');
}
