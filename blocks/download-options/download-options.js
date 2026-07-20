/**
 * Download Options — a data-only block holding the full version/platform/package
 * → URL release matrix for a sibling download card. Each authored row is one
 * combo (version, platform, package, url). This block renders nothing visible;
 * the adjacent cards-download block reads these rows to drive its functional
 * Version / Platform / Package dropdowns and Download button.
 *
 * We normalize each row into `data-*` attributes so cards-download.js can read
 * the matrix without re-parsing field markup, then hide the block.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const options = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    // Row cells are, in model order: version, platform, package, url.
    const [versionCell, platformCell, packageCell, urlCell] = cells;
    const text = (el) => (el ? el.textContent.trim() : '');
    const link = urlCell ? urlCell.querySelector('a') : null;
    const option = {
      version: text(versionCell),
      platform: text(platformCell),
      package: text(packageCell),
      url: link ? link.getAttribute('href') : text(urlCell),
    };
    if (option.version && option.platform && option.package && option.url) {
      options.push(option);
    }
  });

  // Expose the parsed matrix on the element for the sibling card to consume.
  block.dataset.options = JSON.stringify(options);
  block.setAttribute('aria-hidden', 'true');
}
