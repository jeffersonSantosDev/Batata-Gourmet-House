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
    comp.types.forEach(type => acc[type] = comp.long_name);
    return acc;
  }, {});

  // Crava SP/City
  document.getElementById('state').value = 'SP';
  document.getElementById('city').value  = 'São Paulo';

  // Bairro sempre readonly
  document.getElementById('locality').value = 
    comps['sublocality_level_1'] ||
    comps['sublocality'] ||
    comps['neighborhood'] ||
    '';

  // **Rua**  
  const streetEl = document.getElementById('street');
  if (comps['route']) {
    streetEl.value = comps['route'];
    streetEl.readOnly = true;
  } else {
    streetEl.value = '';
    streetEl.readOnly = false;   // libera edição
    streetEl.placeholder = 'Informe a rua manualmente';
    streetEl.focus();
  }

  // **Número**
  const numberEl = document.getElementById('number');
  if (comps['street_number']) {
    numberEl.value = comps['street_number'];
    numberEl.readOnly = true;
  } else {
    numberEl.value = '';
    numberEl.readOnly = false;   // libera edição
    numberEl.placeholder = 'Informe o número';
  }
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
