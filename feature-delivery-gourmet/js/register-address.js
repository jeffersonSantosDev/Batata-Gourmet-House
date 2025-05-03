document.addEventListener("DOMContentLoaded", () => {
  const backBtn     = document.getElementById("backBtn");
  const form        = document.getElementById("newAddressForm");
  const localityEl  = document.getElementById("locality");
  const streetEl    = document.getElementById("street");
  const numberEl    = document.getElementById("number");
  const referenceEl = document.getElementById("reference");

  const errLocality = document.getElementById("localityError");
  const errStreet   = document.getElementById("streetError");
  const errNumber   = document.getElementById("numberError");

  backBtn.addEventListener("click", () => {
    history.length > 1
      ? history.back()
      : window.location.href = "./identify.html";
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    // limpa erros
    [errLocality, errStreet, errNumber].forEach(el => el.classList.add("hidden"));

    let hasError = false;

    // valida Localidade
    if (!localityEl.value.trim()) {
      errLocality.classList.remove("hidden");
      hasError = true;
    }

    // valida Endereço
    if (!streetEl.value.trim()) {
      errStreet.classList.remove("hidden");
      hasError = true;
    }

    // valida Número
    if (!numberEl.value.trim()) {
      errNumber.classList.remove("hidden");
      hasError = true;
    }

    if (hasError) return;

    // se tudo ok, pode chamar sua API ou redirecionar:
    // ex: submit via fetch e depois window.location.href = "checkout.html"
    console.log("Localidade:",  localityEl.value);
    console.log("Endereço:",    streetEl.value);
    console.log("Número:",      numberEl.value);
    console.log("Referência:",  referenceEl.value);
    // aqui você faz o POST...
  });
});
