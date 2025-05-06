let autocomplete;

function initAutocomplete() {
  const streetInput = document.getElementById('street');
  autocomplete = new google.maps.places.Autocomplete(streetInput, {
    types: ['address'],
    componentRestrictions: { country: 'br' }
  });
  autocomplete.addListener('place_changed', fillInAddress);
}

function fillInAddress() {
  const place = autocomplete.getPlace();
  const comps = place.address_components.reduce((acc, c) => {
    c.types.forEach(type => acc[type] = c.long_name);
    return acc;
  }, {});

  // Preenche automaticamente alguns campos
  document.getElementById('locality').value =
    comps['sublocality_level_1'] ||
    comps['sublocality'] ||
    comps['neighborhood'] ||
    '';
  document.getElementById('city').value =
    comps['administrative_area_level_2'] || 'São Paulo';
  document.getElementById('state').value =
    comps['administrative_area_level_1'] || 'SP';
}

document.addEventListener("DOMContentLoaded", () => {
  const backBtn     = document.getElementById("backBtn");
  const form        = document.getElementById("newAddressForm");
  const localityEl  = document.getElementById("locality");
  const streetEl    = document.getElementById("street");
  const numberEl    = document.getElementById("number");
  const referenceEl = document.getElementById("reference");

  const errLocality = document.getElementById("localityError");
  const errStreet   = document.getElementById("streetError");
  const errNumber   = document.getElementById("numberError");

  backBtn.addEventListener("click", () => {
    history.length > 1
      ? history.back()
      : window.location.href = "./identify.html";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    [errLocality, errStreet, errNumber].forEach(el => el.classList.add("hidden"));

    let hasError = false;
    if (!localityEl.value.trim()) { errLocality.classList.remove("hidden"); hasError = true; }
    if (!streetEl.value.trim())   { errStreet.classList.remove("hidden");   hasError = true; }
    if (!numberEl.value.trim())   { errNumber.classList.remove("hidden");   hasError = true; }
    if (hasError) return;

    // Monta payload
    const payload = {
      uf: document.getElementById('state').value,
      cidade: document.getElementById('city').value,
      bairro: localityEl.value.trim(),
      endereco: streetEl.value.trim(),
      numero: numberEl.value.trim(),
      referencia: referenceEl.value.trim()
    };

    // Chama sua API (exemplo)
    try {
      const resp = await fetch('/api/Usuario/AddAddress', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error();
      swal("Sucesso", "Endereço cadastrado com sucesso!", "success")
        .then(() => window.location.href = 'index.html');
    } catch {
      swal("Erro", "Não foi possível cadastrar o endereço. Tente novamente mais tarde.", "error");
    }
  });
});
