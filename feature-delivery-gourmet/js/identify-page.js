document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loadingOverlay").classList.add("hidden");

  const form = document.getElementById("identifyForm");
  const whatsappEl = document.getElementById("whatsapp");
  const nameEl = document.getElementById("name");
  const errW = document.getElementById("whatsappError");
  const errN = document.getElementById("nameError");
  const backBtn = document.getElementById("backBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");

  const params = new URLSearchParams(location.search);
  const returnPage = params.get("return") || "index.html";

  // Preenche campos se já houver dados no localStorage
  const savedName = localStorage.getItem("bgHouse_name");
  const savedWhats = localStorage.getItem("bgHouse_whatsapp");
  if (savedName && savedWhats) {
    nameEl.value = savedName;
    let digits = savedWhats.replace(/^55/, "").replace(/\D/g, "");
    if (digits.length === 11)
      whatsappEl.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    else if (digits.length === 10)
      whatsappEl.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // Utilitários
  function showLoading() {
    loadingOverlay.classList.remove("hidden");
  }

  function hideLoading() {
    loadingOverlay.classList.add("hidden");
  }

  backBtn.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.location.href = returnPage;
  });

  // Máscara de WhatsApp
  whatsappEl.addEventListener("keydown", e => {
    const ok = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];
    if (!ok.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
  });

  whatsappEl.addEventListener("input", e => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6)
      v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2)
      v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    else
      v = v.replace(/^(\d{0,2}).*/, "($1");
    e.target.value = v;
  });

  // Busca usuário ao sair do campo
  whatsappEl.addEventListener("blur", async () => {
    const numero = whatsappEl.value.replace(/\D/g, "");
    if (numero.length < 10 || numero.length > 11) return;

    const numeroFull = "55" + numero;

    try {
      showLoading();

      const response = await fetch("https://batatagourmethouse.runasp.net/api/Usuario/GetUserByWhatsApp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: numeroFull })
      });

      if (response.status === 200) {
        const data = await response.json();
        nameEl.value = data.nome;
        localStorage.setItem("bgHouse_name", data.nome);
        localStorage.setItem("bgHouse_whatsapp", data.whatsApp);
        localStorage.setItem("bgHouse_id", btoa(data.id));
      } else if (response.status === 204) {
        nameEl.value = "";
        localStorage.removeItem("bgHouse_name");
        localStorage.removeItem("bgHouse_whatsapp");
        localStorage.removeItem("bgHouse_id");
      }
    } catch (err) {
      console.error("Erro na API:", err);
    } finally {
      hideLoading();
    }
  });

  // Envio do formulário
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
  
    const numeroFull = "55" + digits;
  
    const confirm = await swal({
      title: "Confirmar dados?",
      text: `WhatsApp: ${w}\nNome: ${n}`,
      icon: "info",
      buttons: ["Cancelar", "Confirmar"]
    });
  
    if (!confirm) return;
  
    const localNome = localStorage.getItem("bgHouse_name") || "";
    const localWhats = localStorage.getItem("bgHouse_whatsapp") || "";
    const localId = localStorage.getItem("bgHouse_id");
  
    // 1. Cria novo usuário se não houver ID
    if (!localId) {
      try {
        const response = await fetch("https://batatagourmethouse.runasp.net/api/Usuario/AddUserByWhatsApp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: n, whatsApp: numeroFull })
        });
  
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("bgHouse_name", data.nome);
          localStorage.setItem("bgHouse_whatsapp", data.whatsApp);
          localStorage.setItem("bgHouse_id", btoa(data.id));
          await swal("Sucesso!", "Usuário criado com sucesso.", "success");
        } else {
          throw new Error("Falha ao criar usuário.");
        }
      } catch (err) {
        console.error("Erro ao criar usuário:", err);
        await swal("Erro", "Não foi possível salvar os dados. Tente novamente.", "error");
        return;
      }
    }
  
    // 2. Se já existe, verifica se mudou e atualiza
    else if (n !== localNome || numeroFull !== localWhats) {
      try {
        const response = await fetch("https://batatagourmethouse.runasp.net/api/Usuario/UpdateUserByWhatsApp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: atob(localId),
            nome: n,
            whatsApp: numeroFull
          })
        });
  
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("bgHouse_name", data.nome);
          localStorage.setItem("bgHouse_whatsapp", data.whatsApp);
          localStorage.setItem("bgHouse_id", btoa(data.id));
          await swal("Atualizado!", "Dados do usuário atualizados.", "success");
        } else {
          throw new Error("Falha ao atualizar usuário.");
        }
      } catch (err) {
        console.error("Erro ao atualizar usuário:", err);
        await swal("Erro", "Não foi possível atualizar os dados.", "error");
        return;
      }
    }
  
    // Redireciona após operação
    setTimeout(() => {
      const params = new URLSearchParams(location.search);
      let returnPage = params.get("return") || "index.html";
  
      if (!returnPage.startsWith("/")) {
        const folder = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
        returnPage = folder + returnPage;
      }
  
      window.location.href = returnPage;
    }, 100);
  });
  


});

// define identifyUser aqui ou no identify.js global
