// js/entrega.js

// Mostra e esconde loader (reaproveite do utils.js)
function showLoader() {
    document.getElementById("loadingOverlay").classList.remove("hidden");
  }
  function hideLoader() {
    document.getElementById("loadingOverlay").classList.add("hidden");
  }
  
  // Função que você já tem em outra tela
  async function fetchUserAddresses(whatsapp) {
    showLoader();
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
      await swal("Erro", "Não foi possível carregar seus endereços. Tente novamente mais tarde.", "error");
      window.location.href = 'identify.html?return=entrega.html';
    } finally {
      hideLoader();
    }
  }
  
  document.addEventListener("DOMContentLoaded", async () => {
    const backBtn     = document.getElementById("backBtn");
    const userNameEl  = document.getElementById("userName");
    const userPhoneEl = document.getElementById("userPhone");
    const form        = document.getElementById("addressesForm");
    const addBtn      = document.getElementById("addAddressBtn");
    const nextBtn     = document.getElementById("nextBtn");
    const totalEl     = document.getElementById("total");
    const fmt         = v => v.toFixed(2).replace(".",",");
  
    backBtn.onclick = () => window.location.href = "index.html";
  
    // Recupera WhatsApp e nome
    const whatsapp = localStorage.getItem("bgHouse_whatsapp");
    const nome     = localStorage.getItem("bgHouse_name") || "Usuário";
    if (!whatsapp) {
      return swal("Ops!", "Identifique-se.", "warning")
        .then(() => window.location.href = "identify.html?return=entrega.html");
    }
    userNameEl.textContent  = nome;
    userPhoneEl.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');
  
    // Total
    const total = parseFloat(localStorage.getItem("bgHouse_total") || "0");
    totalEl.textContent = `R$ ${fmt(total)}`;
  
    // Carrega endereços
    const addresses = await fetchUserAddresses(whatsapp);
    form.innerHTML = "";
    addresses.forEach(addr => {
      const label = document.createElement("label");
      label.className = "address-option" + (addr.padrao ? " address-default" : "");
      label.innerHTML = `
        <input type="radio"
               name="addressId"
               value="${addr.id}"
               ${addr.padrao ? "checked" : ""} />
        <div class="address-label">
          ${addr.rua}, ${addr.numero}${addr.referencia ? ` (<i>${addr.referencia}</i>)` : ""}
          <small>${addr.bairro} - ${addr.cidade}/${addr.uf}</small>
          <small>Dist: ${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • Frete R$ ${fmt(addr.frete)}</small>
        </div>`;
      form.appendChild(label);
    });
  
    addBtn.onclick = () => window.location.href = "register-address.html";
  
    nextBtn.onclick = () => {
      const chosen = form.addressId.value;
      if (!chosen) {
        swal("Atenção", "Escolha um endereço.", "warning");
        return;
      }
      window.location.href = `checkout.html?addressId=${chosen}`;
    };
  });
  