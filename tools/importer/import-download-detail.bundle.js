/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-download-detail.js
  var import_download_detail_exports = {};
  __export(import_download_detail_exports, {
    default: () => import_download_detail_default
  });

  // tools/importer/parsers/columns.js
  function parse(element, { document }) {
    const link = element.querySelector("a[href]");
    const href = link ? link.getAttribute("href") : null;
    const pill = element.querySelector('.css-183cktd, [class*="cktd"], span');
    const pillText = pill && pill.textContent.trim() || "BLOG";
    const sentenceSpan = element.querySelector(".css-1oanqc5 > span, .css-1oanqc5 span, .css-1oanqc5");
    let sentenceText = "";
    if (sentenceSpan) {
      sentenceText = sentenceSpan.textContent.replace(/\s+/g, " ").trim();
      sentenceText = sentenceText.replace(/\s*Read blog\s*>+.*$/i, "").replace(/\s*>{2,}\s*$/, "").trim();
    }
    if (!sentenceText && !pillText) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell1 = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = pillText;
    cell1.append(strong);
    const cell2 = document.createElement("p");
    if (href) {
      const a = document.createElement("a");
      a.setAttribute("href", href);
      a.textContent = sentenceText || pillText;
      cell2.append(a);
    } else {
      cell2.textContent = sentenceText;
    }
    const cells = [[cell1, cell2]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse2(element, { document }) {
    const image = element.querySelector(":scope > img, img");
    const heading = element.querySelector('h1, h2, [class*="bqi6cz"]');
    const descEl = element.querySelector(".css-1r84kvf, .css-4i53ku, p");
    const ctaSource = element.querySelector("a[href]");
    if (!heading && !descEl) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) {
      const imgFrag = document.createDocumentFragment();
      imgFrag.appendChild(document.createComment(" field:image "));
      imgFrag.appendChild(image);
      cells.push([imgFrag]);
    }
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(" field:text "));
    if (heading) {
      const h = document.createElement("h1");
      h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      contentFrag.appendChild(h);
    }
    if (descEl) {
      const p = document.createElement("p");
      p.textContent = descEl.textContent.replace(/\s+/g, " ").trim();
      contentFrag.appendChild(p);
    }
    if (ctaSource) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", ctaSource.getAttribute("href"));
      a.textContent = ctaSource.textContent.replace(/\s+/g, " ").trim();
      p.appendChild(a);
      contentFrag.appendChild(p);
    }
    cells.push([contentFrag]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sidebar-nav.js
  function parse3(element, { document }) {
    const container = element.querySelector(":scope > div") || element;
    const topItems = [...container.children].filter((c) => c.tagName === "DIV");
    if (!topItems.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    topItems.forEach((item) => {
      const topLink = item.querySelector(":scope > a[href]");
      if (!topLink) return;
      const headingHref = topLink.getAttribute("href");
      const headingText = topLink.textContent.replace(/\s+/g, " ").trim();
      const childLinks = [...item.querySelectorAll(":scope > div a[href]")];
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:text "));
      if (childLinks.length) {
        const headingP = document.createElement("p");
        const headingA = document.createElement("a");
        headingA.setAttribute("href", headingHref);
        headingA.textContent = headingText;
        headingP.appendChild(headingA);
        frag.appendChild(headingP);
        const ul = document.createElement("ul");
        childLinks.forEach((cl) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.setAttribute("href", cl.getAttribute("href"));
          a.textContent = cl.textContent.replace(/\s+/g, " ").trim();
          li.appendChild(a);
          ul.appendChild(li);
        });
        frag.appendChild(ul);
      } else {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", headingHref);
        a.textContent = headingText;
        p.appendChild(a);
        frag.appendChild(p);
      }
      cells.push([frag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "sidebar-nav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-download.js
  function parse4(element, { document }) {
    const icon = element.querySelector(":scope > img, img.mdb_backup, img");
    const tag = element.querySelector('h3, [class*="169n5o2"]');
    const heading = element.querySelector('h1, [class*="1bqc6bb"]');
    const descWrap = element.querySelector(".css-1otypu5 > div, .css-1otypu5");
    if (!heading && !tag) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell = (hint, build) => {
      const div = document.createElement("div");
      if (build) {
        const content = build();
        if (content) {
          if (hint) div.appendChild(document.createComment(` field:${hint} `));
          div.appendChild(content);
        }
      }
      return div;
    };
    const imageCell = cell("image", () => {
      if (!icon) return null;
      const img = document.createElement("img");
      img.setAttribute("src", icon.getAttribute("src"));
      if (icon.getAttribute("alt")) img.setAttribute("alt", icon.getAttribute("alt"));
      const pic = document.createElement("picture");
      pic.appendChild(img);
      return pic;
    });
    const tagCell = cell("tag", () => {
      if (!tag) return null;
      const h3 = document.createElement("h3");
      h3.textContent = tag.textContent.replace(/\s+/g, " ").trim();
      return h3;
    });
    const headingCell = cell("heading", () => {
      if (!heading) return null;
      const h1 = document.createElement("h1");
      h1.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      return h1;
    });
    const textCell = cell("text", () => {
      if (!descWrap) return null;
      const paras = [...descWrap.querySelectorAll("p")].filter((p) => !p.closest("pre"));
      if (!paras.length) return null;
      const frag = document.createElement("div");
      paras.forEach((p) => frag.appendChild(p.cloneNode(true)));
      return frag;
    });
    const codeArea = element.querySelector('pre textarea[id^="codesnippet"], pre textarea');
    const codeCell = cell("codeSnippet", () => {
      if (!codeArea) return null;
      const raw = (codeArea.value || codeArea.textContent || "").replace(/\n\s+/g, "\n").trim();
      if (!raw) return null;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = raw;
      pre.appendChild(code);
      return pre;
    });
    const selectedValue = (id) => {
      const btn = element.querySelector(`#${id}`);
      if (!btn) return "";
      const val = btn.querySelector(":scope > span, span");
      return val ? val.textContent.replace(/\s+/g, " ").trim() : "";
    };
    const labelCell = (hint, id) => cell(hint, () => {
      const v = selectedValue(id);
      if (!v) return null;
      const p = document.createElement("p");
      p.textContent = v;
      return p;
    });
    const versionCell = labelCell("versionLabel", "download-version");
    const platformCell = labelCell("platformLabel", "download-platform");
    const packageCell = labelCell("packageLabel", "download-package");
    const downloadCell = cell("downloadLink", () => {
      const dl = element.querySelector('.css-162tvoi a[href], a.css-1s626b1, a[href*="repo.mongodb"], a[href*="download"]');
      if (!dl) return null;
      const a = document.createElement("a");
      a.setAttribute("href", dl.getAttribute("href"));
      a.textContent = dl.textContent.replace(/\s+/g, " ").trim() || "Download";
      return a;
    });
    const cells = [[
      imageCell,
      tagCell,
      headingCell,
      textCell,
      codeCell,
      versionCell,
      platformCell,
      packageCell,
      downloadCell
    ]];
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-download", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/mongodb-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#mdb-icon-font-library",
        "iframe"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#ot-sdk-btn-floating",
        ".onetrust-pc-dark-filter",
        ".ot-sdk-container"
      ]);
      const BEACON_HOSTS = /(usbrowserspeed\.com|dpmsrv\.com|adnxs\.com|adsrvr\.org|mathtag\.com|bat\.bing\.com|googleadservices\.com|secure\.adnxs\.com|trkn\.us|insight\.adsrvr\.org|pixel\.mathtag\.com|cookielaw\.org|doubleclick\.net|facebook\.com\/tr|px\.ads\.|intercomcdn\.com|intercom\.io)/i;
      element.querySelectorAll("img[src], a[href], source[src], source[srcset], img[srcset]").forEach((node) => {
        const url = node.getAttribute("src") || node.getAttribute("href") || node.getAttribute("srcset") || "";
        if (/[[\]]/.test(url) || /%5b|%5d/i.test(url) || BEACON_HOSTS.test(url)) {
          node.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "nav.css-1ek23uy",
        "footer.css-1j19lrv",
        "#mdb-icon-font-library",
        "iframe",
        "script",
        "noscript",
        "link",
        // Collapsed mobile version of the download sidebar (a single selected-item
        // label + chevron). The desktop rail (.css-17fcl61 nav) is the authored
        // source; this mobile clone would otherwise leak a stray label into the
        // content. Verified: .css-7moep3 wraps only the mobile nav on all pages.
        ".css-7moep3"
      ]);
    }
  }

  // tools/importer/import-download-detail.js
  var parsers = {
    "columns": parse,
    "hero": parse2,
    "sidebar-nav": parse3,
    "cards-download": parse4
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "download-detail",
    description: "Download page with left sidebar navigation and a main column containing download hero, version/platform/package selectors, download button, and secondary download sections with release links",
    urls: [
      "https://www.mongodb.com/try/download/community"
    ],
    blocks: [
      {
        name: "columns",
        instances: [".pencil-banner-no-underline"],
        section: "banner-green"
      },
      {
        name: "hero",
        instances: ["section.w-full.css-1x76i0b"]
      },
      {
        // Every page has exactly two section.w-full: the hero (css-1x76i0b,
        // stable) and the main content section (hash varies per page). Target the
        // main section as "the w-full section that is NOT the hero" so selectors
        // are independent of the per-page hash. Desktop rail = .css-17fcl61 nav.
        name: "sidebar-nav",
        instances: ["section.w-full:not(.css-1x76i0b) .css-17fcl61 nav.css-1syg30y"],
        section: "download"
      },
      {
        name: "cards-download",
        instances: ["section.w-full:not(.css-1x76i0b) div.css-eeqf"],
        section: "download"
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function stripBracketUrlNodes(root) {
    root.querySelectorAll("a[href], img[src], img[srcset], source[src], source[srcset]").forEach((node) => {
      const url = node.getAttribute("href") || node.getAttribute("src") || node.getAttribute("srcset") || "";
      if (/[[\]]/.test(url) || /%5b|%5d/i.test(url) || /usbrowserspeed\.com|dpmsrv\.com/i.test(url)) {
        node.remove();
      }
    });
  }
  function arrangeSections(main, document, pageBlocks) {
    const byName = (name) => pageBlocks.filter((b) => b.name === name).map((b) => b.element).filter((el) => el && el.parentNode);
    const sidebar = byName("sidebar-nav")[0];
    if (!sidebar) return;
    const ordered = [
      ...byName("columns"),
      ...byName("hero"),
      ...byName("sidebar-nav"),
      ...byName("cards-download")
    ];
    if (!ordered.length) return;
    main.textContent = "";
    ordered.forEach((el) => {
      if (el === sidebar) main.append(document.createElement("hr"));
      main.append(el);
    });
  }
  var GROUPS = {
    "enterprise-advanced": ["enterprise", "ops-manager", "enterprise-kubernetes-operator"],
    "community-edition": ["community", "community-kubernetes-operator", "search-in-community"],
    tools: [
      "terraform-provider",
      "shell",
      "compass",
      "atlascli",
      "atlas-kubernetes-operator",
      "mongocli",
      "mongosync",
      "relational-migrator",
      "database-tools",
      "bi-connector",
      "app-services-cli",
      "vs-code-extension"
    ],
    "sql-interface": ["power-bi-connector", "tableau-connector", "jdbc-driver", "odbc-driver"]
  };
  function slugOf(originalURL) {
    return new URL(originalURL).pathname.replace(/\.html$/, "").replace(/\/$/, "").split("/").pop();
  }
  function scopedPanelIndex(originalURL) {
    const slug = slugOf(originalURL);
    if (GROUPS[slug]) return -1;
    const children = Object.values(GROUPS).find((c) => c.includes(slug));
    return children ? children.indexOf(slug) : -1;
  }
  function findBlocksOnPage(document, template, originalURL) {
    const panelIndex = scopedPanelIndex(originalURL);
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [...document.querySelectorAll(selector)];
        if (blockDef.name === "cards-download" && panelIndex >= 0) {
          elements = elements[panelIndex] ? [elements[panelIndex]] : [];
        }
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_download_detail_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL);
      arrangeSections(main, document, pageBlocks);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      stripBracketUrlNodes(main);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_download_detail_exports);
})();
