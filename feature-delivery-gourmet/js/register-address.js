// register-address.js

// 1) Busca sugestões de endereço via sua função serverless
let suggestions = [];
async function fetchPlaces(input) {
  const resp = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
  if (!resp.ok) throw new Error('Autocomplete failed');
  const json = await resp.json();
  return json.predictions; // [{ description, place_id, ... }, …]
}

// 2) Busca detalhes de um place_id via outra função serverless
async function fetchPlaceDetails(placeId) {
  const resp = await fetch(`/api/placeDetails?place_id=${encodeURIComponent(placeId)}`);
  if (!resp.ok) throw new Error('Place details failed');
  const json = await resp.json();
  return json.result; // conforme Place Details JSON
}

// 3) Preenche os campos com base no Place Details
function fillAllFields(place) {
  const comps = place.address_components.reduce((acc, comp) => {
    comp.types.forEach(type => acc[type] = comp.long_name);
    return acc;
  }, {});

  // Sempre crava SP / São Paulo
  document.getElementById('state').value   = 'SP';
  document.getElementById('city').value    = 'São Paulo';

  // Bairro
  const localityEl = document.getElementById('locality');
  if (comps['sublocality_level_1'] ||
      comps['sublocality'] ||
      comps['neighborhood']) {
    localityEl.value    = comps['sublocality_level_1']
                        || comps['sublocality']
                        || comps['neighborhood'];
    localityEl.readOnly = true;
  } else {
    localityEl.value       = '';
    localityEl.readOnly    = false;
    localityEl.placeholder = 'Informe o bairro';
    localityEl.focus();
  }

  // Rua
  const streetEl = document.getElementById('street');
  if (comps['route']) {
    streetEl.value    = comps['route'];
    streetEl.readOnly = true;
  } else {
    streetEl.value       = '';
    streetEl.readOnly    = false;
    streetEl.placeholder = 'Informe a rua manualmente';
  }

  // Número
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

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const form    = document.getElementById("newAddressForm");
  const autoIn  = document.getElementById("autocomplete");
  const listEl  = document.createElement("ul");
  const errAuto = document.getElementById("autocompleteError");

  listEl.className = "autocomplete-list";
  autoIn.parentNode.appendChild(listEl);

  // 4) Voltar / identificar
  backBtn.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.location.href = "./identify.html";
  });

  // 5) Enquanto digita, busca sugestões
  autoIn.addEventListener("input", async () => {
    const v = autoIn.value.trim();
    if (v.length < 3) {
      listEl.innerHTML = "";
      return;
    }
    try {
      suggestions = await fetchPlaces(v);
      listEl.innerHTML = suggestions
        .map((p, i) => `<li data-idx="${i}">${p.description}</li>`)
        .join("");
    } catch (e) {
      console.error(e);
    }
  });

  // 6) Ao clicar numa sugestão, pega detalhes e preenche
  listEl.addEventListener("click", async e => {
    const li = e.target.closest("li[data-idx]");
    if (!li) return;
    const idx = +li.dataset.idx;
    const placeId = suggestions[idx].place_id;
    listEl.innerHTML = "";
    autoIn.value = suggestions[idx].description;

    try {
      const details = await fetchPlaceDetails(placeId);
      fillAllFields(details);
    } catch (err) {
      console.error(err);
      swal("Erro", "Não foi possível obter detalhes do endereço.", "error");
    }
  });

  // 7) Submit do formulário
  form.addEventListener("submit", async e => {
    e.preventDefault();
    errAuto.classList.add("hidden");

    // Recupera WhatsApp
    const whatsapp = localStorage.getItem("bgHouse_whatsapp");
    if (!whatsapp) {
      return swal("Erro", "Usuário não identificado. Volte e identifique-se.", "error");
    }

    // Lê campos obrigatórios
    const bairro = document.getElementById("locality").value.trim();
    const rua    = document.getElementById("street").value.trim();
    const numero = document.getElementById("number").value.trim();

    // Valida
    if (!bairro) return swal("Atenção", "Bairro não foi preenchido.", "warning");
    if (!rua)    { errAuto.classList.remove("hidden"); return; }
    if (!numero) return swal("Atenção", "Número do endereço não foi preenchido.", "warning");

    // Monta payload
    const payload = {
      NumeroWhatsApp: whatsapp,
      Uf:             "SP",
      Cidade:         "São Paulo",
      Bairro:         bairro,
      Rua:            rua,
      Numero:         numero,
      Referencia:     document.getElementById("reference").value.trim()
    };

    // Chama seu endpoint de salvar
    try {
      const resp = await fetch("/api/Usuario/SaveAddresByWhatsApp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      });

      if (resp.status === 204) {
        return swal("Erro", "Usuário não encontrado. Identifique-se novamente.", "error");
      }
      if (!resp.ok) throw new Error();

      swal("Sucesso", "Endereço cadastrado com sucesso!", "success")
        .then(() => window.location.href = "index.html");
    } catch (err) {
      console.error(err);
      swal("Erro", err.message || "Não foi possível cadastrar o endereço. Tente novamente mais tarde.", "error");
    }
  });
});
