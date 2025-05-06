let autocomplete;
function initAutocomplete() {
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('autocomplete'),
    { types: ['address'], componentRestrictions: { country: 'br' } }
  );
  autocomplete.addListener('place_changed', fillInAddress);
}

function fillInAddress() {
  const place = autocomplete.getPlace();
  if (!place.address_components) return;

  const comps = place.address_components.reduce((a, c) => {
    c.types.forEach(t => a[t] = c.long_name);
    return a;
  }, {});

  // Mapeia componentes para seus campos
  document.getElementById('state').value    = comps['administrative_area_level_1'] || '';
  document.getElementById('city').value     = comps['administrative_area_level_2'] || '';
  document.getElementById('locality').value = comps['sublocality_level_1'] 
                                              || comps['sublocality'] 
                                              || comps['neighborhood'] 
                                              || '';
  document.getElementById('street').value   = comps['route'] || '';
  document.getElementById('number').value   = comps['street_number'] || '';
}

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const form    = document.getElementById("newAddressForm");
  const autoEl  = document.getElementById("autocomplete");
  const errAuto = document.getElementById("autocompleteError");

  backBtn.addEventListener("click", () => {
    history.length > 1
      ? history.back()
      : window.location.href = "./identify.html";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    errAuto.classList.add("hidden");

    // Garante que o usuário selecionou algo do Autocomplete
    if (!document.getElementById('street').value) {
      errAuto.classList.remove("hidden");
      return;
    }

    // Monta payload apenas com os campos necessários
    const payload = {
      uf:       document.getElementById('state').value,
      cidade:   document.getElementById('city').value,
      bairro:   document.getElementById('locality').value,
      endereco: document.getElementById('street').value,
      numero:   document.getElementById('number').value,
      referencia: document.getElementById('reference').value.trim()
    };

    try {
      const resp = await fetch('/api/Usuario/AddAddress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
