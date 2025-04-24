// js/identify.js
document.addEventListener("DOMContentLoaded", () => {
    const form        = document.getElementById("identifyForm");
    const whatsappEl  = document.getElementById("whatsapp");
    const nameEl      = document.getElementById("name");
    const errWhats    = document.getElementById("whatsappError");
    const errName     = document.getElementById("nameError");
    const backBtn     = document.getElementById("backBtn");
    const ordersScr   = document.getElementById("ordersScreen");
    const identScr    = document.getElementById("identifyScreen");
    const closeOrders = document.getElementById("closeOrders");
    const ordersTable = document.getElementById("ordersTable");
  
    // limpa storage em reload
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav && nav.type === "reload") localStorage.clear();
  
    // Bloqueia letras no keydown (permite dígitos e teclas de navegação)
    whatsappEl.addEventListener("keydown", e => {
      const allowed = ["Backspace","ArrowLeft","ArrowRight","Delete","Tab"];
      if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    });
  
    // Máscara no input
    whatsappEl.addEventListener("input", e => {
      let v = e.target.value.replace(/\D/g, "").slice(0,11);
      if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
      } else {
        v = v.replace(/^(\d{0,2}).*/, "($1");
      }
      e.target.value = v;
    });
  
    // voltar / fallback
    backBtn.addEventListener("click", () => {
      history.length > 1
        ? history.back()
        : window.location.href = "/";
    });
  
    // fecha pedidos
    closeOrders.addEventListener("click", () => {
      ordersScr.classList.add("hidden");
      identScr.classList.remove("hidden");
    });
  
    // se já identificado, pula para pedidos
    const savedW = localStorage.getItem("bgHouse_whatsapp");
    const savedN = localStorage.getItem("bgHouse_name");
    if (savedW && savedN) {
      whatsappEl.value = savedW;
      nameEl.value     = savedN;
      showOrders();
      identScr.classList.add("hidden");
      ordersScr.classList.remove("hidden");
    }
  
    // submit: valida e salva
    form.addEventListener("submit", async e => {
      e.preventDefault();
      errWhats.classList.add("hidden");
      errName .classList.add("hidden");
  
      const w      = whatsappEl.value.trim();
      const n      = nameEl.value.trim();
      const digits = w.replace(/\D/g, "");
      let hasError = false;
  
      if (digits.length < 10 || digits.length > 11) {
        errWhats.classList.remove("hidden");
        hasError = true;
      }
      if (n.length < 3) {
        errName.classList.remove("hidden");
        hasError = true;
      }
      if (hasError) return;
  
      const ok = await swal({
        title: "Salvar dados?",
        text:  `WhatsApp: ${w}\nNome: ${n}`,
        icon:  "info",
        buttons: ["Cancelar","Confirmar"]
      });
      if (!ok) return;
  
      localStorage.setItem("bgHouse_whatsapp", w);
      localStorage.setItem("bgHouse_name", n);
      swal("Sucesso!", "Seus dados foram salvos.", "success");
  
      showOrders();
      identScr.classList.add("hidden");
      ordersScr.classList.remove("hidden");
    });
  
    // renderiza últimos pedidos
    function showOrders() {
      let list = JSON.parse(localStorage.getItem("bgHouse_orders") || "[]");
      if (!list.length) {
        list = [{ id:1024, date:"05/05/2025", total:"R$ 32,00" }];
        localStorage.setItem("bgHouse_orders", JSON.stringify(list));
      }
      ordersTable.innerHTML = list.map(o => {
        let t = o.total.replace(/\s?AED$/i, "").trim();
        if (!t.startsWith("R$")) t = `R$ ${t.replace(".", ",")}`;
        return `
          <tr>
            <td>${o.date}</td>
            <td>${t}</td>
            <td><a href="order.html?id=${o.id}" class="order-link">Ver Pedido</a></td>
          </tr>
        `;
      }).join("");
    }
  });
  