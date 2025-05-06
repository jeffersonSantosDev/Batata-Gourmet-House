// register-address.js

// 1) Busca sugestões via /api/places
async function fetchPlaces(input) {
  const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
  if (!res.ok) throw new Error("Autocomplete failed");
  const { predictions } = await res.json();
  return predictions;
}

// 2) Busca detalhes via /api/placeDetails
async function fetchPlaceDetails(placeId) {
  const res = await fetch(`/api/placeDetails?place_id=${encodeURIComponent(placeId)}`);
  if (!res.ok) throw new Error("Place details failed");
  return await res.json();  // contém address_components
}

// 3) Preenche os campos a partir do objeto placeDetails
function fillFieldsFromPlace(place) {
  const comps = place.address_components.reduce((acc, c) => {
    c.types.forEach(t => acc[t] = c.long_name);
    return acc;
  }, {});

  document.getElementById("locality").value = 
    comps.sublocality_level_1 || comps.sublocality || comps.neighborhood || "";
  document.getElementById("street").value   = comps.route || "";
  document.getElementById("number").value   = comps.street_number || "";
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

  // verifica usuário identificado
  const whatsapp = localStorage.getItem("bgHouse_whatsapp");
  if (!whatsapp) return window.location.replace("identify.html");

  // botão voltar
  backBtn.addEventListener("click", () => {
    history.length > 1 ? history.back() : window.location.href = "identify.html";
  });

  // enquanto digita, carrega sugestões
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

  // ao clicar numa sugestão
  listEl.addEventListener("click", async e => {
    const li = e.target.closest("li[data-idx]");
    if (!li) return;
    autoIn.value = li.textContent;
    listEl.innerHTML = "";

    // busca detalhes
    const placeId = li.dataset.placeid;
    try {
      const place = await fetchPlaceDetails(placeId);

      // extrai estado e país
      const comps = place.address_components.reduce((acc, c) => {
        c.types.forEach(t => acc[t] = c.long_name);
        return acc;
      }, {});
      const estado = comps.administrative_area_level_1;
      const pais   = comps.country;

      // Se não for Brasil/SP, bloqueia
      if (pais !== "Brasil" || estado !== "São Paulo") {
        swal("Desculpe", "Só entregamos em São Paulo/SP.", "error")
          .then(() => {
            autoIn.value = "";
            locEl.value = "";
            streetEl.value = "";
            numEl.value = "";
          });
        return;
      }

      // preenche os campos
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
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      if (resp.status === 204)
        return swal("Erro","Usuário não encontrado.","error");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      swal("Sucesso","Endereço cadastrado com sucesso!","success")
        .then(() => window.location.href = "index.html");
    } catch (err) {
      console.error(err);
      swal("Erro", err.message || "Falha ao cadastrar endereço.","error");
    }
  });
});
