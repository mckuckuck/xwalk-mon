/**
 * Account signup form.
 *
 * Structural capture only — live submission/backend behavior is intentionally
 * deferred. Each authored row describes one form control:
 *   [ Label , Type , Required ]
 * Rows without a recognized type before the first field are rendered as intro
 * copy (heading / subheading) above the form; rows without a recognized type
 * after the last field are rendered as auxiliary content (e.g. a "Sign in"
 * link) below the form.
 *
 * @param {Element} block The block element
 */
const FIELD_TYPES = ['text', 'email', 'password', 'tel', 'checkbox', 'submit'];

function buildField(cell, type, required) {
  const wrapper = document.createElement('div');
  wrapper.className = `form-field form-field-${type}`;

  const text = (cell.textContent || '').trim();
  const id = `form-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  if (type === 'checkbox') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    if (required) input.required = true;
    const lab = document.createElement('label');
    lab.setAttribute('for', id);
    // Preserve rich-text (Terms of Service / Privacy Policy links).
    lab.append(...cell.childNodes);
    wrapper.append(input, lab);
    return wrapper;
  }

  if (type === 'submit') {
    const button = document.createElement('button');
    // Non-functional by design: backend wiring is deferred.
    button.type = 'button';
    button.className = 'button primary form-submit';
    button.textContent = text;
    wrapper.append(button);
    return wrapper;
  }

  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.autocomplete = 'off';
  if (required) input.required = true;

  const lab = document.createElement('label');
  lab.setAttribute('for', id);
  lab.textContent = required ? `${text}*` : text;

  wrapper.append(lab, input);

  if (type === 'password') {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'form-password-toggle';
    toggle.setAttribute('aria-label', 'Show password');
    toggle.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      toggle.classList.toggle('is-visible', show);
    });
    wrapper.append(toggle);
  }

  return wrapper;
}

export default function decorate(block) {
  const rows = [...block.children].map((row) => {
    const cells = [...row.children];
    const type = (cells[1]?.textContent || '').trim().toLowerCase();
    return {
      cell: cells[0],
      type,
      required: /^(true|yes|required|\*)$/i.test((cells[2]?.textContent || '').trim()),
      isField: FIELD_TYPES.includes(type),
    };
  });

  const firstFieldIdx = rows.findIndex((r) => r.isField);
  const lastFieldIdx = rows.reduce((acc, r, i) => (r.isField ? i : acc), -1);

  const form = document.createElement('form');
  form.className = 'form-fields';
  form.setAttribute('novalidate', '');
  // Structural only — never actually submit.
  form.addEventListener('submit', (e) => e.preventDefault());

  const intro = document.createElement('div');
  intro.className = 'form-intro';

  const aux = document.createElement('div');
  aux.className = 'form-aux';

  rows.forEach((r, i) => {
    if (r.isField) {
      form.append(buildField(r.cell, r.type, r.required));
    } else if (firstFieldIdx === -1 || i < firstFieldIdx) {
      intro.append(...r.cell.childNodes);
    } else if (i > lastFieldIdx) {
      aux.append(...r.cell.childNodes);
    }
  });

  block.replaceChildren();
  if (intro.childNodes.length) block.append(intro);
  block.append(form);
  if (aux.childNodes.length) form.append(aux);
}
