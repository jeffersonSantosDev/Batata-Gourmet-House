// register-address.js

// 1) Busca sugestões via /api/places
async function fetchPlaces(input) {
  const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
  if (!res.ok) throw new Error("Autocomplete failed");
  const { predictions } = await res.json();
  return predictions;
}

// 2) Busca detalhes via /api/places (place_id)
// agora unificado em /api/places?place_id=
async function fetchPlaceDetails(placeId) {
  const res = await fetch(`/api/places?place_id=${encodeURIComponent(placeId)}`);
  if (!res.ok) throw new Error("Place details failed");
  const { details } = await res.json();
  return details;  // { address_components: [...] }
}

// 3) Preenche e controla readonly de cada campo
function fillFieldsFromPlace(place) {
  const comps = place.address_components.reduce((acc, c) => {
    c.types.forEach(t => acc[t] = c.long_name);
    return acc;
  }, {});

  const localityEl = document.getElementById("locality");
  const streetEl   = document.getElementById("street");
  const numEl      = document.getElementById("number");

  // Bairro
  if (comps.sublocality_level_1 || comps.sublocality || comps.neighborhood) {
    localityEl.value = comps.sublocality_level_1 || comps.sublocality || comps.neighborhood;
    localityEl.readOnly = true;
  } else {
    localityEl.value = "";
    localityEl.readOnly = false;
    localityEl.placeholder = "Informe o bairro";
    localityEl.focus();
  }

  // Rua
  if (comps.route) {
    streetEl.value = comps.route;
    streetEl.readOnly = true;
  } else {
    streetEl.value = "";
    streetEl.readOnly = false;
    streetEl.placeholder = "Informe a rua";
  }

  // Número
  if (comps.street_number) {
    numEl.value = comps.street_number;
    numEl.readOnly = true;
  } else {
    numEl.value = "";
    numEl.readOnly = false;
    numEl.placeholder = "Informe o número";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const backBtn  = document.getElementById("backBtn");
  const form     = document.getElementById("newAddressForm");
  const autoIn   = document.getElementById("autocomplete");
  const listEl   = document.querySelector(".autocomplete-list");
  const errAuto  = document.getElementById("autocompleteError");
  const stateEl  = document.getElementById("state");
  const cityEl   = document.getElementById("city");
  const locEl    = document.getElementById("locality");
  const streetEl = document.getElementById("street");
  const numEl    = document.getElementById("number");
  const refEl    = document.getElementById("reference");

  // fixa SP/São Paulo
  stateEl.value = "SP";
  cityEl.value  = "São Paulo";

  // inicia readonly
  [locEl, streetEl, numEl].forEach(el => el.readOnly = true);

  // filtro de dígitos no número
  numEl.addEventListener("input", e => {
    const filtered = e.target.value.replace(/\D+/g, "");
    if (e.target.value !== filtered) e.target.value = filtered;
  });

  // verifica usuário
  const whatsapp = localStorage.getItem("bgHouse_whatsapp");
  if (!whatsapp) return window.location.replace("identify.html");

  // voltar
  backBtn.addEventListener("click", () => {
    history.length > 1 ? history.back() : window.location.href = "identify.html";
  });

  // sugestões
  autoIn.addEventListener("input", async () => {
    const q = autoIn.value.trim();
    listEl.innerHTML = "";
    if (q.length < 3) return;
    try {
      const preds = await fetchPlaces(q);
      listEl.innerHTML = preds.map((p,i) =>
        `<li data-idx="${i}" data-placeid="${p.place_id}">${p.description}</li>`
      ).join("");
    } catch (e) {
      console.error(e);
    }
  });

  // seleção
  listEl.addEventListener("click", async e => {
    const li = e.target.closest("li[data-idx]");
    if (!li) return;
    autoIn.value = li.textContent;
    listEl.innerHTML = "";

    try {
      const place = await fetchPlaceDetails(li.dataset.placeid);

      // valida SP/BR
      const comps = place.address_components.reduce((a,c) => {
        c.types.forEach(t=>a[t]=c.long_name);
        return a;
      }, {});
      if (comps.country !== "Brasil" || comps.administrative_area_level_1 !== "São Paulo") {
        return swal("Desculpe", "Só entregamos em São Paulo/SP.", "error")
          .then(()=>{
            autoIn.value = "";
            [locEl,streetEl,numEl].forEach(el=>el.value="", el.readOnly=true);
          });
      }

      fillFieldsFromPlace(place);
    } catch (err) {
      console.error(err);
      swal("Erro", "Não foi possível obter detalhes do endereço.", "error");
    }
  });

  // submit
  form.addEventListener("submit", async e => {
    e.preventDefault();
    errAuto.classList.add("hidden");

    const bairro = locEl.value.trim();
    const rua    = streetEl.value.trim();
    const num    = numEl.value.trim();

    if (!bairro) return swal("Atenção","Bairro não preenchido.","warning");
    if (!rua)    return swal("Atenção","Rua não preenchida.","warning");
    if (!num)    return swal("Atenção","Número não preenchido.","warning");

    const payload = {
      NumeroWhatsApp: whatsapp,
      Uf:             "SP",
      Cidade:         "São Paulo",
      Bairro:         bairro,
      Rua:            rua,
      Numero:         num,
      Referencia:     refEl.value.trim()
    };

    try {
      const resp = await fetch("/api/Usuario/SaveAddresByWhatsApp", {
        method:  "POST",
        headers: {"Content-Type":"application/json"},
        body:    JSON.stringify(payload)
      });
      if (resp.status === 204)
        return swal("Erro","Usuário não encontrado.","error");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      swal("Sucesso","Endereço cadastrado com sucesso!","success")
        .then(()=>window.location.href="index.html");
    } catch (err) {
      console.error(err);
      swal("Erro", err.message || "Falha ao cadastrar endereço.","error");
    }
  });
});
