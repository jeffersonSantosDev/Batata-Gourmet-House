// js/identify-page.js
document.addEventListener("DOMContentLoaded", () => {
    const form       = document.getElementById("identifyForm");
    if (!form) return; // se não existir (ex: estamos no index), sai imediatamente
  
    const whatsappEl = document.getElementById("whatsapp");
    const nameEl     = document.getElementById("name");
    const errW       = document.getElementById("whatsappError");
    const errN       = document.getElementById("nameError");
    const backBtn = document.getElementById("backBtn");

  
    // Para onde voltar depois do cadastro
    const params     = new URLSearchParams(location.search);
    const retorno    = params.get("return") || "index.html";
  
    backBtn.addEventListener("click", () => {
        // se houver histórico, volta; senão, joga na página de retorno
        if (history.length > 1) history.back();
        else window.location.href = returnPage;
      });
      
    // Máscara de WhatsApp
    whatsappEl.addEventListener("keydown", e => {
      const ok = ["Backspace","ArrowLeft","ArrowRight","Delete","Tab"];
      if (!ok.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
    });
    whatsappEl.addEventListener("input", e => {
      let v = e.target.value.replace(/\D/g, "").slice(0,11);
      if (v.length > 6)      v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/,        "($1) $2");
      else                   v = v.replace(/^(\d{0,2}).*/,              "($1");
      e.target.value = v;
    });
  
    form.addEventListener("submit", async e => {
      e.preventDefault();
      errW.classList.add("hidden");
      errN.classList.add("hidden");
  
      const w = whatsappEl.value.trim();
      const n = nameEl.value.trim();
      const digits = w.replace(/\D/g, "");
      let hasError = false;
  
      if (digits.length < 10 || digits.length > 11) {
        errW.classList.remove("hidden");
        hasError = true;
      }
      if (n.length < 3) {
        errN.classList.remove("hidden");
        hasError = true;
      }
      if (hasError) return;
  
      const ok = await swal({
        title: "Confirmar dados?",
        text:  `WhatsApp: ${w}\nNome: ${n}`,
        icon:  "info",
        buttons: ["Cancelar","Confirmar"]
      });
      if (!ok) return;
  
      localStorage.setItem("bgHouse_whatsapp", w);
      localStorage.setItem("bgHouse_name",     n);
      await swal("Sucesso!", "Seus dados foram salvos.", "success");
  
      window.location.href = retorno;
    });
  });
  