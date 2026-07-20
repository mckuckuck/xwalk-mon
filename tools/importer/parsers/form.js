/* eslint-disable */
/* global WebImporter */
/**
 * Parser for form ("Create your Atlas Account" signup form).
 * Base block: form (new project block).
 * Source: https://www.mongodb.com/try (#atlas-form and its heading/subheading)
 * Generated: 2026-07-07
 *
 * STRUCTURAL capture only — live submission / backend behavior is deferred.
 *
 * Container block. Model blocks/form/_form.json + block JS blocks/form/form.js:
 *   parent form           -> text (richtext intro: heading + subheading)
 *   child  form-field     -> [ label (richtext) , type (select) , required (boolean) ]
 * The block JS treats rows whose type cell is not a known field type as intro
 * copy, so heading/subheading and auxiliary controls (SSO, "Sign in") are
 * emitted as intro-style rows (type cell left empty).
 *
 * xwalk field hints per field row: label, type, required.
 */
const KNOWN_TYPES = ['text', 'email', 'password', 'tel', 'checkbox', 'submit'];

function fieldRow(document, labelHtml, type, required) {
  const labelCell = document.createElement('div');
  labelCell.appendChild(document.createComment(' field:label '));
  const labelWrap = document.createElement('p');
  labelWrap.innerHTML = labelHtml;
  labelCell.appendChild(labelWrap);

  const typeCell = document.createElement('div');
  typeCell.appendChild(document.createComment(' field:type '));
  typeCell.appendChild(document.createTextNode(type));

  const reqCell = document.createElement('div');
  reqCell.appendChild(document.createComment(' field:required '));
  reqCell.appendChild(document.createTextNode(required ? 'true' : 'false'));

  return [labelCell, typeCell, reqCell];
}

function introRow(document, contentNodes) {
  const cell = document.createElement('div');
  cell.appendChild(document.createComment(' field:label '));
  contentNodes.forEach((n) => cell.appendChild(n));
  // Empty type/required cells keep the 3-column shape; block JS treats an
  // unrecognized/empty type as intro copy.
  const empty1 = document.createElement('div');
  const empty2 = document.createElement('div');
  return [cell, empty1, empty2];
}

export default function parse(element, { document }) {
  const form = element.id === 'atlas-form' ? element : element.querySelector('#atlas-form, form');
  if (!form) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Intro: heading + subheading are the form's preceding siblings within the
  // form's containing panel (h4.css-1sqomng + span.css-4l4k76). Scope to that
  // panel so we don't pick up the page-level hero heading.
  const panel = form.closest('.css-2eqikc') || form.parentElement || document;
  const heading = panel.querySelector('.css-1sqomng, h4, h3, h2')
    || document.querySelector('.css-1sqomng');
  const subheading = panel.querySelector('.css-4l4k76')
    || document.querySelector('.css-4l4k76');
  const introNodes = [];
  if (heading) {
    const h = document.createElement('h2');
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    introNodes.push(h);
  }
  if (subheading) {
    const p = document.createElement('p');
    p.textContent = subheading.textContent.replace(/\s+/g, ' ').trim();
    introNodes.push(p);
  }
  if (introNodes.length) cells.push(introRow(document, introNodes));

  // Text-like inputs paired with their labels.
  const textInputs = [
    { id: 'firstName', type: 'text' },
    { id: 'lastName', type: 'text' },
    { id: 'company', type: 'text' },
    { id: 'email', type: 'email' },
    { id: 'password', type: 'password' },
  ];
  textInputs.forEach(({ id, type }) => {
    const input = form.querySelector(`#${id}`);
    if (!input) return;
    const wrap = input.closest('.css-11oo1fi') || input.parentElement;
    const label = wrap && wrap.querySelector('label');
    const labelText = (label ? label.textContent : id).replace(/\s+/g, ' ').trim();
    const required = /\*$/.test(labelText);
    const cleanLabel = labelText.replace(/\*$/, '').trim();
    cells.push(fieldRow(document, cleanLabel, type, required));
  });

  // Terms checkbox with rich-text ToS + Privacy Policy links.
  const terms = form.querySelector('#terms');
  if (terms) {
    const termsLabel = terms.closest('div').querySelector('label .css-de5i40, label');
    const labelHtml = termsLabel ? termsLabel.innerHTML : 'I agree to the Terms of Service and Privacy Policy.';
    cells.push(fieldRow(document, labelHtml, 'checkbox', true));
  }

  // Primary submit button.
  const submit = form.querySelector('button.css-von91e, button[type="submit"], button');
  if (submit) {
    cells.push(fieldRow(document, submit.textContent.replace(/\s+/g, ' ').trim(), 'submit', false));
  }

  // Auxiliary content as intro rows: "or" divider, Google SSO, "Sign in".
  const sso = form.querySelector('a[href*="sso/google"]');
  if (sso) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', sso.getAttribute('href'));
    a.textContent = 'Sign up with Google';
    p.appendChild(a);
    cells.push(introRow(document, [p]));
  }
  const signIn = form.querySelector('a[href*="login"]');
  if (signIn) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', signIn.getAttribute('href'));
    a.textContent = signIn.textContent.replace(/\s+/g, ' ').trim() || 'Sign in';
    p.appendChild(a);
    cells.push(introRow(document, [p]));
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'form', cells });
  element.replaceWith(block);
}
