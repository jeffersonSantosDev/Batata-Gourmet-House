document.addEventListener("DOMContentLoaded", () => {
    const backBtn   = document.getElementById("backBtn");
    const form      = document.getElementById("newAddressForm");
  
    const localityEl = document.getElementById("locality");
    const streetEl   = document.getElementById("street");
    const numberEl   = document.getElementById("number");
    const refEl      = document.getElementById("reference");
  
    const errStreet = document.getElementById("streetError");
    const errNumber = document.getElementById("numberError");
  
    // botão voltar
    backBtn.addEventListener("click", () => {
      history.length > 1
        ? history.back()
        : window.location.href = "./editar-endereco.html";
    });
  
    form.addEventListener("submit", e => {
      e.preventDefault();
      // limpa erros
      [errStreet, errNumber].forEach(el => el.classList.add("hidden"));
  
      let hasError = false;
      if (!streetEl.value.trim()) {
        errStreet.classList.remove("hidden");
        hasError = true;
      }
      if (!numberEl.value.trim()) {
        errNumber.classList.remove("hidden");
        hasError = true;
      }
      if (hasError) return;
  
      // monta o objeto (UF e cidade fixos)
      const newAddr = {
        id:      Date.now(),
        uf:      "SP",
        city:    "São Paulo",
        label:   `${streetEl.value.trim()}, ${numberEl.value.trim()}`,
        details: localityEl.value.trim() || ""
      };
  
      // salva no localStorage
      const arr = JSON.parse(localStorage.getItem("bgHouse_addresses") || "[]");
      arr.push(newAddr);
      localStorage.setItem("bgHouse_addresses", JSON.stringify(arr));
  
      // volta para edição
      window.location.href = "./editar-endereco.html";
    });
  });
  