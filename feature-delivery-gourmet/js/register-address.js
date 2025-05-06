// 1) Função para buscar sugestões via /api/places
async function fetchPlaces(input) {
  const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
  if (!res.ok) throw new Error("Autocomplete failed");
  const { predictions } = await res.json();
  return predictions;
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

  // verifica identificação
  const whatsapp = localStorage.getItem("bgHouse_whatsapp");
  if (!whatsapp) return window.location.replace("identify.html");

  // voltar
  backBtn.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.location.href = "identify.html";
  });

  // enquanto digita → sugestões
  autoIn.addEventListener("input", async () => {
    const q = autoIn.value.trim();
    listEl.innerHTML = "";
    if (q.length < 3) return;
    try {
      const preds = await fetchPlaces(q);
      listEl.innerHTML = preds.map((p, i) =>
        `<li data-idx="${i}">${p.description}</li>`
      ).join("");
    } catch (e) {
      console.error(e);
    }
  });

  // ao clicar na sugestão
  listEl.addEventListener("click", e => {
    const li = e.target.closest("li[data-idx]");
    if (!li) return;
    autoIn.value = li.textContent;
    listEl.innerHTML = "";
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
