// js/entrega.js

function showLoader() {
    document.getElementById("loadingOverlay").classList.remove("hidden");
  }
  function hideLoader() {
    document.getElementById("loadingOverlay").classList.add("hidden");
  }
  
  // Busca endereços
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
      await swal("Erro", "Não foi possível carregar seus endereços.", "error");
      window.location.href = 'identify.html?return=entrega.html';
      return [];
    } finally {
      hideLoader();
    }
  }
  
  // Busca carrinho
  async function fetchCart(whatsapp) {
    const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
    if (!resp.ok) throw new Error('Erro ao carregar carrinho');
    return await resp.json();
  }
  
  // Calcula desconto se houver cupom
  async function calcularCupom(codigo, usuarioId, lojaId, subtotal) {
    const resp = await fetch('/api/Cupom/CalcularDesconto', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','Accept':'application/json' },
      body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
    });
    if (!resp.ok) return { sucesso: false };
    return await resp.json(); // { sucesso, dados, mensagem }
  }
  
  document.addEventListener("DOMContentLoaded", async () => {
    const backBtn     = document.getElementById("backBtn");
    const userNameEl  = document.getElementById("userName");
    const userPhoneEl = document.getElementById("userPhone");
    const form        = document.getElementById("addressesForm");
    const addBtn      = document.getElementById("addAddressBtn");
    const limitMsg    = document.getElementById("limitMsg");
    const nextBtn     = document.getElementById("nextBtn");
    const subtotalEl  = document.getElementById("subtotal");
    const cupomLine   = document.getElementById("cupomLine");
    const cupomValue  = document.getElementById("cupomValue");
    const finalTotal  = document.getElementById("finalTotal");
    const fmt         = v => v.toFixed(2).replace(".",",");
  
    backBtn.onclick = () => window.location.href = "index.html";
  
    // Usuário
    const whatsapp   = localStorage.getItem("bgHouse_whatsapp");
    const nome       = localStorage.getItem("bgHouse_name") || "Você";
    const lojaId     = parseInt(localStorage.getItem("bgHouse_lojaId"));
    const usuarioId  = localStorage.getItem("bgHouse_id")
                        ? parseInt(atob(localStorage.getItem("bgHouse_id")))
                        : null;
    if (!whatsapp || !usuarioId) {
      await swal("Ops!","Identifique-se.","warning");
      return window.location.href = "identify.html?return=entrega.html";
    }
    userNameEl.textContent  = nome;
    userPhoneEl.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');
  
    // 1) Carrega carrinho e mostra valores
    let cart, subtotal = 0, desconto = 0;
    try {
      cart = await fetchCart(whatsapp);
      subtotal = cart.items.reduce((s,i)=> s + i.precoUnitario*i.quantidade, 0);
      subtotalEl.textContent = `R$ ${fmt(subtotal)}`;
    } catch {
      subtotalEl.textContent = `R$ 0,00`;
    }
  
    // 2) Se cupom no storage, re-calcula
    const savedCupom = localStorage.getItem("bgHouse_appliedCoupon");
    if (savedCupom) {
      const res = await calcularCupom(savedCupom, usuarioId, lojaId, subtotal);
      if (res.sucesso) {
        desconto = res.dados;
        cupomLine.style.display = "flex";
        cupomValue.textContent = `- R$ ${fmt(desconto)}`;
      } else {
        localStorage.removeItem("bgHouse_appliedCoupon");
      }
    }
    finalTotal.textContent = `R$ ${fmt(subtotal - desconto)}`;
  
    // 3) Endereços
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
  
    // 4) Limite de 2 endereços
    if (addresses.length >= 2) {
      addBtn.disabled = true;
      limitMsg.style.display = "block";
    }
    addBtn.onclick = () => {
      if (!addBtn.disabled) window.location.href = "novo-endereco.html";
    };
  
    // 5) Próximo
    nextBtn.onclick = () => {
      const chosen = form.addressId.value;
      if (!chosen) {
        swal("Atenção","Escolha um endereço.","warning");
        return;
      }
      window.location.href = `checkout.html?addressId=${chosen}`;
    };
  });
  