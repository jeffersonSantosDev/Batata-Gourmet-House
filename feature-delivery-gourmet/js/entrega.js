// js/entrega.js

function showLoader() {
    document.getElementById("loadingOverlay").classList.remove("hidden");
  }
  function hideLoader() {
    document.getElementById("loadingOverlay").classList.add("hidden");
  }
  
  // Só faz a chamada; não mexe no loader aqui
  async function fetchUserAddresses(whatsapp) {
    try {
      const resp = await fetch('/api/Usuario/GetAddressesByWhatsApp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: whatsapp })
      });
      if (resp.status === 204) return [];
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error(err);
      await swal("Erro", "Não foi possível carregar seus endereços.", "error");
      window.location.href = 'identify.html?return=entrega.html';
      return [];
    }
  }
  
  document.addEventListener("DOMContentLoaded", async () => {
    showLoader();  // ⬅ só aqui
  
    try {
      const backBtn     = document.getElementById("backBtn");
      const userNameEl  = document.getElementById("userName");
      const userPhoneEl = document.getElementById("userPhone");
      const form        = document.getElementById("addressesForm");
      const addBtn      = document.getElementById("addAddressBtn");
      const nextBtn     = document.getElementById("nextBtn");
      const totalEl     = document.getElementById("total");
      const fmt         = v => v.toFixed(2).replace(".",",");
  
      backBtn.onclick = () => window.location.href = "index.html";
  
      const whatsapp = localStorage.getItem("bgHouse_whatsapp");
      const nome     = localStorage.getItem("bgHouse_name") || "Usuário";
      if (!whatsapp) {
        await swal("Ops!", "Identifique-se.", "warning");
        return window.location.href = "identify.html?return=entrega.html";
      }
      userNameEl.textContent  = nome;
      userPhoneEl.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');
  
      // TOTAL
      const total = parseFloat(localStorage.getItem("bgHouse_total") || "0");
      totalEl.textContent = `R$ ${fmt(total)}`;
  
      // Carrega e renderiza endereços
      const addresses = await fetchUserAddresses(whatsapp);
      form.innerHTML = "";
      addresses.forEach(addr => {
        const label = document.createElement("label");
        label.className = "address-option" + (addr.padrao ? " address-default" : "");
        label.innerHTML = `
          <input type="radio" name="addressId" value="${addr.id}"
                ${addr.padrao ? "checked" : ""} />
          <div class="address-label">
            ${addr.rua}, ${addr.numero}${addr.referencia ? ` (<i>${addr.referencia}</i>)` : ""}
            <small>${addr.bairro} - ${addr.cidade}/${addr.uf}</small>
            <small>Dist: ${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • Frete R$ ${fmt(addr.frete)}</small>
          </div>`;
        form.appendChild(label);
      });
  
      addBtn.onclick = () => window.location.href = "novo-endereco.html";
  
      nextBtn.onclick = () => {
        const chosen = form.addressId.value;
        if (!chosen) {
          swal("Atenção", "Escolha um endereço.", "warning");
          return;
        }
        window.location.href = `checkout.html?addressId=${chosen}`;
      };
  
    } finally {
      hideLoader(); // ⬅ e sempre escondemos aqui
    }
  });
  