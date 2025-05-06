// 1) importe o Loader diretamente de um CDN como módulo ES
import { Loader } from 'https://unpkg.com/@googlemaps/js-api-loader?module';

let autocomplete;

// 2) inicializa a API assim que carregar o módulo
const loader = new Loader({
  apiKey: 'AIzaSyB1fNIX_jYvev0ASAjGvyOfK2wAtx_hCKM',  // só para teste
  libraries: ['places']
});

loader.load().then(() => {
  const input = document.getElementById('autocomplete');
  autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'br' }
  });
  autocomplete.addListener('place_changed', fillInAddress);
});

// 3) quando o usuário selecionar, preenche os campos
function fillInAddress() {
  const place = autocomplete.getPlace();
  if (!place.address_components) return;

  const comps = place.address_components.reduce((acc, comp) => {
    comp.types.forEach(t => acc[t] = comp.long_name);
    return acc;
  }, {});

  document.getElementById('state').value    = comps['administrative_area_level_1'] || '';
  document.getElementById('city').value     = comps['administrative_area_level_2'] || '';
  document.getElementById('locality').value = comps['sublocality_level_1']
                                              || comps['sublocality']
                                              || comps['neighborhood']
                                              || '';
  document.getElementById('street').value   = comps['route'] || '';
  document.getElementById('number').value   = comps['street_number'] || '';
}

// 4) restante da lógica de UI / validação / submit
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const form    = document.getElementById("newAddressForm");
  const errAuto = document.getElementById("autocompleteError");

  backBtn.addEventListener("click", () => {
    history.length > 1 ? history.back() : window.location.href = "./identify.html";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    errAuto.classList.add("hidden");

    // se street estiver vazio, não selecionou
    if (!document.getElementById('street').value) {
      errAuto.classList.remove("hidden");
      return;
    }

    // monta payload
    const payload = {
      uf:        document.getElementById('state').value,
      cidade:    document.getElementById('city').value,
      bairro:    document.getElementById('locality').value,
      endereco:  document.getElementById('street').value,
      numero:    document.getElementById('number').value,
      referencia:document.getElementById('reference').value.trim()
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
