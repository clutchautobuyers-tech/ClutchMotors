// Set copyright year in footer
document.getElementById('year-copy').textContent = new Date().getFullYear();

// ===== ELEMENTS =====
const form            = document.getElementById('quoteForm');
const submitBtn       = document.getElementById('submitBtn');
const btnText         = document.getElementById('btn-text');
const btnSpinner      = document.getElementById('btn-spinner');
const formSuccess     = document.getElementById('formSuccess');
const formError       = document.getElementById('formError');
const ownershipSelect = document.getElementById('ownership');
const bankGroup       = document.getElementById('bank-group');
const vinInput        = document.getElementById('vin');
const decodeBtn       = document.getElementById('decodeBtn');
const decodeStatus    = document.getElementById('decode-status');

// ===== VIN DECODER =====
let vinDecoded = false;

function setDecodeStatus(message, type) {
  decodeStatus.textContent = message;
  decodeStatus.className = 'decode-status' + (type ? ' ' + type : '');
}

function clearDecodedFields() {
  ['year', 'make', 'model'].forEach(id => {
    document.getElementById(id).value = '';
    document.getElementById(id).classList.remove('input-decoded');
    setFieldError(id, null);
  });
}

async function decodeVin() {
  const vin = vinInput.value.trim().toUpperCase();
  if (vin.length !== 17) {
    setDecodeStatus('VIN must be 17 characters.', 'error');
    return;
  }

  setDecodeStatus('Decoding...', 'loading');
  decodeBtn.disabled = true;

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
    );
    const data = await res.json();
    const r = data.Results && data.Results[0];
    const year  = r && r.ModelYear && r.ModelYear.trim();
    const make  = r && r.Make && r.Make.trim();
    const model = r && r.Model && r.Model.trim();

    if (!year || !make || !model || year === '0') throw new Error('decode failed');

    const makeFmt = make.charAt(0) + make.slice(1).toLowerCase();
    document.getElementById('year').value  = year;
    document.getElementById('make').value  = makeFmt;
    document.getElementById('model').value = model;

    ['year', 'make', 'model'].forEach(id => {
      document.getElementById(id).classList.add('input-decoded');
      setFieldError(id, null);
    });

    setDecodeStatus(`✓ ${year} ${makeFmt} ${model}`, 'success');
    setFieldError('vin', null);
    vinDecoded = true;
  } catch {
    setDecodeStatus('Could not decode this VIN. Enter year, make & model below.', 'error');
    clearDecodedFields();
    vinDecoded = false;
  } finally {
    decodeBtn.disabled = false;
  }
}

// Auto-decode when 17 chars typed
vinInput.addEventListener('input', () => {
  vinInput.value = vinInput.value.toUpperCase();
  setFieldError('vin', null);
  if (vinDecoded) {
    clearDecodedFields();
    setDecodeStatus('', '');
    vinDecoded = false;
  }
  if (vinInput.value.length === 17) decodeVin();
});

decodeBtn.addEventListener('click', decodeVin);

// ===== OWNERSHIP / BANK =====
ownershipSelect.addEventListener('change', () => {
  const needsBank = ownershipSelect.value === 'Financed' || ownershipSelect.value === 'Leased';
  bankGroup.style.display = needsBank ? 'flex' : 'none';
  if (!needsBank) {
    document.getElementById('bank').value = '';
    setFieldError('bank', null);
  }
});

// ===== VALIDATION =====
function setFieldError(id, message) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(id + '-error');
  if (!input) return;
  if (message) {
    input.classList.add('input-error');
    if (errorEl) errorEl.textContent = message;
  } else {
    input.classList.remove('input-error');
    if (errorEl) errorEl.textContent = '';
  }
}

const contactFields = [
  { id: 'mileage',   validate: (v) => /^\d[\d,]*$/.test(v.trim()) ? null : 'Enter a valid mileage.' },
  { id: 'condition', validate: (v) => v ? null : 'Please select a condition.' },
  { id: 'ownership', validate: (v) => v ? null : 'Please select an ownership type.' },
  { id: 'name',      validate: (v) => v.trim().length >= 2 ? null : 'Enter your full name.' },
  { id: 'phone',     validate: (v) => /^[\d\s\(\)\-\+]{7,20}$/.test(v.trim()) ? null : 'Enter a valid phone number.' },
  { id: 'email',     validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email address.' },
];

function validateAll() {
  let valid = true;

  const vin   = vinInput.value.trim();
  const year  = document.getElementById('year').value.trim();
  const make  = document.getElementById('make').value.trim();
  const model = document.getElementById('model').value.trim();
  const hasVin = vin.length === 17;
  const hasManual = year && make && model;

  // Must have VIN or all three manual fields
  if (!hasVin && !hasManual) {
    if (!hasVin) setFieldError('vin', 'Enter a VIN — or fill in year, make & model below.');
    if (!year)  setFieldError('year',  'Required if no VIN.');
    if (!make)  setFieldError('make',  'Required if no VIN.');
    if (!model) setFieldError('model', 'Required if no VIN.');
    valid = false;
  } else {
    setFieldError('vin', null);
    if (year)  setFieldError('year', null);
    if (make)  setFieldError('make', null);
    if (model) setFieldError('model', null);

    // Validate year format if provided
    if (year && !/^\d{4}$/.test(year)) {
      setFieldError('year', 'Enter a valid 4-digit year.');
      valid = false;
    }
  }

  for (const field of contactFields) {
    const el = document.getElementById(field.id);
    const error = field.validate(el.value);
    setFieldError(field.id, error);
    if (error) valid = false;
  }

  const needsBank = ownershipSelect.value === 'Financed' || ownershipSelect.value === 'Leased';
  if (needsBank) {
    const bankVal = document.getElementById('bank').value.trim();
    const bankError = bankVal.length >= 2 ? null : 'Enter the bank or lender name.';
    setFieldError('bank', bankError);
    if (bankError) valid = false;
  }

  return valid;
}

// Live clear errors on input
[...contactFields, { id: 'year' }, { id: 'make' }, { id: 'model' }].forEach(({ id }) => {
  const el = document.getElementById(id);
  if (!el) return;
  const event = el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(event, () => setFieldError(id, null));
});
document.getElementById('bank').addEventListener('input', (e) => {
  setFieldError('bank', e.target.value.trim().length >= 2 ? null : 'Enter the bank or lender name.');
});

// ===== PHOTO UPLOAD =====
const photoInput    = document.getElementById('photos');
const photoPreviews = document.getElementById('photo-previews');
const photosError   = document.getElementById('photos-error');
let selectedPhotos  = [];

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 5;

photoInput.addEventListener('change', () => {
  const files = Array.from(photoInput.files);
  photosError.textContent = '';

  for (const file of files) {
    if (selectedPhotos.length >= MAX_PHOTOS) {
      photosError.textContent = `Max ${MAX_PHOTOS} photos allowed.`;
      break;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      photosError.textContent = `"${file.name}" is too large. Max ${MAX_SIZE_MB}MB per photo.`;
      continue;
    }
    if (selectedPhotos.find(p => p.name === file.name && p.size === file.size)) continue;

    const reader = new FileReader();
    reader.onload = (e) => {
      const photo = { name: file.name, dataUrl: e.target.result };
      selectedPhotos.push(photo);
      renderPhotoPreview(photo);
    };
    reader.readAsDataURL(file);
  }
  photoInput.value = '';
});

function renderPhotoPreview(photo) {
  const thumb = document.createElement('div');
  thumb.className = 'photo-thumb';
  thumb.dataset.name = photo.name;
  thumb.innerHTML = `
    <img src="${photo.dataUrl}" alt="${photo.name}" />
    <button type="button" class="photo-thumb-remove" aria-label="Remove">✕</button>
  `;
  thumb.querySelector('.photo-thumb-remove').addEventListener('click', () => {
    selectedPhotos = selectedPhotos.filter(p => p.name !== photo.name);
    thumb.remove();
    photosError.textContent = '';
  });
  photoPreviews.appendChild(thumb);
}

// ===== LOADING STATE =====
function setLoading(loading) {
  submitBtn.disabled = loading;
  btnText.textContent = loading ? 'Sending...' : 'Get My Cash Offer';
  btnSpinner.hidden = !loading;
}

// ===== SUBMIT =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  if (!validateAll()) return;

  setLoading(true);

  const ownership = ownershipSelect.value;
  const needsBank = ownership === 'Financed' || ownership === 'Leased';
  const payload = {
    vin:       vinInput.value.trim().toUpperCase(),
    year:      document.getElementById('year').value.trim(),
    make:      document.getElementById('make').value.trim(),
    model:     document.getElementById('model').value.trim(),
    mileage:   document.getElementById('mileage').value.trim(),
    condition: document.getElementById('condition').value,
    ownership,
    bank:      needsBank ? document.getElementById('bank').value.trim() : '',
    name:      document.getElementById('name').value.trim(),
    phone:     document.getElementById('phone').value.trim(),
    email:     document.getElementById('email').value.trim(),
    photos:    selectedPhotos.map(p => ({ name: p.name, dataUrl: p.dataUrl })),
  };

  try {
    const res = await fetch('/submit-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      form.hidden = true;
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      formError.hidden = false;
      setLoading(false);
    }
  } catch {
    formError.hidden = false;
    setLoading(false);
  }
});
