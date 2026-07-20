var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-try-signup.js
  var import_try_signup_exports = {};
  __export(import_try_signup_exports, {
    default: () => import_try_signup_default
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

  // tools/importer/parsers/form.js
  function fieldRow(document, labelHtml, type, required) {
    const labelCell = document.createElement("div");
    labelCell.appendChild(document.createComment(" field:label "));
    const labelWrap = document.createElement("p");
    labelWrap.innerHTML = labelHtml;
    labelCell.appendChild(labelWrap);
    const typeCell = document.createElement("div");
    typeCell.appendChild(document.createComment(" field:type "));
    typeCell.appendChild(document.createTextNode(type));
    const reqCell = document.createElement("div");
    reqCell.appendChild(document.createComment(" field:required "));
    reqCell.appendChild(document.createTextNode(required ? "true" : "false"));
    return [labelCell, typeCell, reqCell];
  }
  function introRow(document, contentNodes) {
    const cell = document.createElement("div");
    cell.appendChild(document.createComment(" field:label "));
    contentNodes.forEach((n) => cell.appendChild(n));
    const empty1 = document.createElement("div");
    const empty2 = document.createElement("div");
    return [cell, empty1, empty2];
  }
  function parse4(element, { document }) {
    const form = element.id === "atlas-form" ? element : element.querySelector("#atlas-form, form");
    if (!form) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const panel = form.closest(".css-2eqikc") || form.parentElement || document;
    const heading = panel.querySelector(".css-1sqomng, h4, h3, h2") || document.querySelector(".css-1sqomng");
    const subheading = panel.querySelector(".css-4l4k76") || document.querySelector(".css-4l4k76");
    const introNodes = [];
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      introNodes.push(h);
    }
    if (subheading) {
      const p = document.createElement("p");
      p.textContent = subheading.textContent.replace(/\s+/g, " ").trim();
      introNodes.push(p);
    }
    if (introNodes.length) cells.push(introRow(document, introNodes));
    const textInputs = [
      { id: "firstName", type: "text" },
      { id: "lastName", type: "text" },
      { id: "company", type: "text" },
      { id: "email", type: "email" },
      { id: "password", type: "password" }
    ];
    textInputs.forEach(({ id, type }) => {
      const input = form.querySelector(`#${id}`);
      if (!input) return;
      const wrap = input.closest(".css-11oo1fi") || input.parentElement;
      const label = wrap && wrap.querySelector("label");
      const labelText = (label ? label.textContent : id).replace(/\s+/g, " ").trim();
      const required = /\*$/.test(labelText);
      const cleanLabel = labelText.replace(/\*$/, "").trim();
      cells.push(fieldRow(document, cleanLabel, type, required));
    });
    const terms = form.querySelector("#terms");
    if (terms) {
      const termsLabel = terms.closest("div").querySelector("label .css-de5i40, label");
      const labelHtml = termsLabel ? termsLabel.innerHTML : "I agree to the Terms of Service and Privacy Policy.";
      cells.push(fieldRow(document, labelHtml, "checkbox", true));
    }
    const submit = form.querySelector('button.css-von91e, button[type="submit"], button');
    if (submit) {
      cells.push(fieldRow(document, submit.textContent.replace(/\s+/g, " ").trim(), "submit", false));
    }
    const sso = form.querySelector('a[href*="sso/google"]');
    if (sso) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", sso.getAttribute("href"));
      a.textContent = "Sign up with Google";
      p.appendChild(a);
      cells.push(introRow(document, [p]));
    }
    const signIn = form.querySelector('a[href*="login"]');
    if (signIn) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.setAttribute("href", signIn.getAttribute("href"));
      a.textContent = signIn.textContent.replace(/\s+/g, " ").trim() || "Sign in";
      p.appendChild(a);
      cells.push(introRow(document, [p]));
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "form", cells });
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

  // tools/importer/import-try-signup.js
  var parsers = {
    "columns": parse,
    "hero": parse2,
    "sidebar-nav": parse3,
    "form": parse4
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "try-signup",
    description: "Product intro page with hero heading, description, explore-products link, left sidebar navigation, and an account signup form in the main column",
    urls: [
      "https://www.mongodb.com/try"
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
        name: "sidebar-nav",
        instances: ["section.w-full.css-11phdyl .css-17fcl61 nav.css-1syg30y"],
        section: "signup"
      },
      {
        name: "form",
        instances: ["#atlas-form"],
        section: "signup"
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
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
      ...byName("form")
    ];
    if (!ordered.length) return;
    main.textContent = "";
    ordered.forEach((el) => {
      if (el === sidebar) main.append(document.createElement("hr"));
      main.append(el);
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
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
  var import_try_signup_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
  return __toCommonJS(import_try_signup_exports);
})();
