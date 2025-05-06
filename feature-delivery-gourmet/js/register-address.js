// register-address.js

/**
 * 1) Busca sugestões de endereço via sua função serverless
 */
async function fetchPlaces(input) {
  const resp = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
  if (!resp.ok) throw new Error('Autocomplete failed');
  const { predictions } = await resp.json();
  return predictions;  // array de { description, place_id, ... }
}

document.addEventListener("DOMContentLoaded", () => {
  // Elementos-chave
  const backBtn     = document.getElementById("backBtn");
  const form        = document.getElementById("newAddressForm");
  const autoIn      = document.getElementById("autocomplete");
  const listEl      = document.querySelector(".autocomplete-list");
  const errAuto     = document.getElementById("autocompleteError");
  const stateEl     = document.getElementById("state");
  const cityEl      = document.getElementById("city");
  const locEl       = document.getElementById("locality");
  const streetEl    = document.getElementById("street");
  const numberEl    = document.getElementById("number");
  const referenceEl = document.getElementById("reference");

  // 0) Fixar SP/São Paulo
  stateEl.value = "SP";
  cityEl.value  = "São Paulo";

  // 1) Verifica identificação
  const whatsapp = localStorage.getItem("bgHouse_whatsapp");
  if (!whatsapp) {
    return window.location.replace("identify.html");
  }

  // 2) Voltar
  backBtn.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.location.href = "identify.html";
  });

  // 3) Autocomplete: enquanto digita, busca e mostra sugestões
  autoIn.addEventListener("input", async () => {
    const q = autoIn.value.trim();
    listEl.innerHTML = "";
    if (q.length < 3) return;

    try {
      const suggestions = await fetchPlaces(q);
      listEl.innerHTML = suggestions
        .map((p, i) => `<li data-idx="${i}">${p.description}</li>`)
        .join("");
    } catch (err) {
      console.error(err);
    }
  });

  // 4) Clique numa sugestão: preenche apenas o input e esconde a lista
  listEl.addEventListener("click", e => {
    const li = e.target.closest("li[data-idx]");
    if (!li) return;
    autoIn.value = li.textContent;
    listEl.innerHTML = "";
  });

  // 5) Submit: valida e envia para SaveAddresByWhatsApp
  form.addEventListener("submit", async e => {
    e.preventDefault();
    errAuto.classList.add("hidden");

    // Leitura
    const bairro = locEl.value.trim();
    const rua    = streetEl.value.trim();
    const num    = numberEl.value.trim();
    const referencia = referenceEl.value.trim();

    // Validações
    if (!bairro) return swal("Atenção", "Bairro não foi preenchido.", "warning");
    if (!rua)    return swal("Atenção", "Rua não foi preenchida.", "warning");
    if (!num)    return swal("Atenção", "Número não foi preenchido.", "warning");

    // Prepara payload
    const payload = {
      NumeroWhatsApp: whatsapp,
      Uf:             "SP",
      Cidade:         "São Paulo",
      Bairro:         bairro,
      Rua:            rua,
      Numero:         num,
      Referencia:     referencia
    };

    try {
      const resp = await fetch("/api/Usuario/SaveAddresByWhatsApp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      });

      if (resp.status === 204) {
        return swal("Erro", "Usuário não encontrado. Identifique-se novamente.", "error");
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      // Sucesso
      swal("Sucesso", "Endereço cadastrado com sucesso!", "success")
        .then(() => window.location.href = "index.html");
    } catch (err) {
      console.error(err);
      swal("Erro", err.message || "Não foi possível cadastrar o endereço.", "error");
    }
  });
});
