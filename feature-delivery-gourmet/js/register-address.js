// 1) importe o Loader diretamente de um CDN como módulo ES
import { Loader } from 'https://unpkg.com/@googlemaps/js-api-loader?module';

let autocomplete;

// 2) inicializa a API assim que carregar o módulo
const loader = new Loader({ 
  apiKey: process.env.google_maps_key,
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

  // Crava SP e São Paulo
  document.getElementById('state').value = 'SP';
  document.getElementById('city').value  = 'São Paulo';

  // **Bairro (locality)**
  const localityEl = document.getElementById('locality');
  if (comps['sublocality_level_1'] ||
      comps['sublocality'] ||
      comps['neighborhood']) {

    localityEl.value    = comps['sublocality_level_1']
                        || comps['sublocality']
                        || comps['neighborhood'];
    localityEl.readOnly = true;

  } else {
    // libera edição manual de bairro
    localityEl.value       = '';
    localityEl.readOnly    = false;
    localityEl.placeholder = 'Informe o bairro';
    localityEl.focus();
  }

  // **Rua**
  const streetEl = document.getElementById('street');
  if (comps['route']) {
    streetEl.value    = comps['route'];
    streetEl.readOnly = true;
  } else {
    streetEl.value       = '';
    streetEl.readOnly    = false;
    streetEl.placeholder = 'Informe a rua manualmente';
  }

  // **Número**
  const numberEl = document.getElementById('number');
  if (comps['street_number']) {
    numberEl.value    = comps['street_number'];
    numberEl.readOnly = true;
  } else {
    numberEl.value       = '';
    numberEl.readOnly    = false;
    numberEl.placeholder = 'Informe o número';
  }
}


// 4) restante da lógica de UI / validação / submit
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const form    = document.getElementById("newAddressForm");
  const errAuto = document.getElementById("autocompleteError");

  const whatsapp = localStorage.getItem("bgHouse_whatsapp");
  if (!whatsapp) {
    return window.location.replace("identify.html");
  }

  // Voltar
  backBtn.addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.location.href = "./identify.html";
    }
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    errAuto.classList.add("hidden");

    // 1) Recupera WhatsApp do usuário
    const whatsapp = localStorage.getItem("bgHouse_whatsapp");
    if (!whatsapp) {
      return swal("Erro", "Usuário não identificado. Volte e identifique-se.", "error");
    }

    // 2) Lê campos obrigatórios
    const uf     = document.getElementById("state").value.trim();
    const cidade = document.getElementById("city").value.trim();
    const bairro = document.getElementById("locality").value.trim();
    const rua    = document.getElementById("street").value.trim();
    const numero = document.getElementById("number").value.trim();

    // 3) Validações
    if (!bairro) {
      return swal("Atenção", "Bairro não foi preenchido.", "warning");
    }
    if (!rua) {
      errAuto.classList.remove("hidden");
      return;
    }
    if (!numero) {
      return swal("Atenção", "Número do endereço não foi preenchido.", "warning");
    }

    // 4) Monta o payload
    const payload = {
      NumeroWhatsApp: whatsapp,
      Uf: uf,
      Cidade: cidade,
      Bairro: bairro,
      Rua: rua,
      Numero: numero,
      Referencia: document.getElementById("reference").value.trim()
    };

    // 5) Chama o endpoint
    try {
      const resp = await fetch("/api/Usuario/SaveAddresByWhatsApp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (resp.status === 204) {
        return swal("Erro", "Usuário não encontrado. Identifique-se novamente.", "error");
      }
      if (!resp.ok) throw new Error();

      // 6) Sucesso: retorna ao início
      swal("Sucesso", "Endereço cadastrado com sucesso!", "success")
        .then(() => window.location.href = "index.html");
    } catch (err) {
      console.error(err);
      swal("Erro", err.message || "Não foi possível cadastrar o endereço. Tente novamente mais tarde.", "error");
    }
  });
});

