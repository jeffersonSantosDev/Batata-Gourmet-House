function showLoader() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

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

function fmt(v) {
  return v.toFixed(2).replace(".", ",");
}

document.addEventListener("DOMContentLoaded", async () => {
  showLoader();

  const backBtn     = document.getElementById("backBtn");
  const userNameEl  = document.getElementById("userName");
  const userPhoneEl = document.getElementById("userPhone");
  const form        = document.getElementById("addressesForm");
  const addBtn      = document.getElementById("addAddressBtn");
  const nextBtn     = document.getElementById("nextBtn");
  const subtotalEl  = document.getElementById("subtotal");
  const cupomLine   = document.getElementById("cupomLine");
  const cupomValue  = document.getElementById("cupomValue");
  const freteEl     = document.getElementById("frete");
  const finalTotal  = document.getElementById("finalTotal");

  const whatsapp     = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  const lojaIdRaw    = localStorage.getItem("bgHouse_lojaId");
  const nome         = localStorage.getItem("bgHouse_name");
  const usuarioId    = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
  const lojaId       = lojaIdRaw ? parseInt(lojaIdRaw) : null;

  if (!whatsapp || !usuarioId || !lojaId) {
    return window.location.href = "identify.html?return=entrega.html";
  }

  userNameEl.textContent  = nome || "Você";
  userPhoneEl.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');

  // Carrinho
  let cart, carrinhoId = null, subtotal = 0, desconto = 0, frete = 0;
  try {
    const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
    cart = await resp.json();
    carrinhoId = cart.cartId;

    if (!cart.items?.length) {
      return window.location.href = "index.html";
    }

    subtotal = cart.items.reduce((sum, item) => {
      const base = item.precoUnitario * item.quantidade;
      const addons = (item.adicionais || []).reduce((s, ad) => s + ad.preco * ad.quantidade, 0);
      return sum + base + addons;
    }, 0);
    subtotalEl.textContent = `R$ ${fmt(subtotal)}`;
  } catch {
    return swal("Erro", "Não foi possível carregar o carrinho.", "error")
      .then(() => window.location.href = "identify.html?return=entrega.html");
  }

  // Cupom
  cupomLine.style.display = "none";
  try {
    const resCupom = await fetch(`/api/Cupom/GetCupomCarrinho?carrinhoId=${carrinhoId}`);
    if (resCupom.ok) {
      const codigo = await resCupom.text();
      if (codigo) {
        const cupomResp = await fetch('/api/Cupom/Aplicar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo,
            usuarioId,
            lojaId,
            valorOriginal: subtotal,
            carrinhoId
          })
        });
        const json = await cupomResp.json();
        if (json.sucesso) {
          desconto = json.dados;
          cupomLine.style.display = "flex";
          cupomValue.textContent  = `- R$ ${fmt(desconto)}`;
        }
      }
    }
  } catch (err) {
    console.warn("Erro ao reaplicar cupom:", err);
  }

  // Endereços
  const addresses = await fetchUserAddresses(whatsapp);
  const enderecoAtual = cart.endereco;
  let enderecoSelecionadoId = enderecoAtual?.id || null;

  form.innerHTML = "";
  addresses.forEach(addr => {
    const isChecked = addr.id === enderecoSelecionadoId;
    const lbl = document.createElement("label");
    lbl.className = "address-option" + (isChecked ? " selected" : "");
    lbl.innerHTML = `
      <input type="radio" name="addressId" value="${addr.id}" ${isChecked ? "checked" : ""}/>
      <div class="address-label">
        <div>${addr.rua}, ${addr.numero}</div>
        ${addr.referencia ? `<div><i>${addr.referencia}</i></div>` : ""}
        <small>${addr.bairro} - ${addr.cidade}/${addr.uf}</small>
        <small>${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • Frete R$ ${fmt(addr.frete)}</small>
      </div>`;
    form.appendChild(lbl);
  });

  function aplicarFrete(addr) {
    enderecoSelecionadoId = addr.id;
    frete = addr.frete;
    freteEl.textContent = `R$ ${fmt(frete)}`;
    finalTotal.textContent = `R$ ${fmt(subtotal - desconto + frete)}`;
    localStorage.setItem("bgHouse_frete", frete.toFixed(2));
    localStorage.setItem("bgHouse_selectedAddress", JSON.stringify(addr));
  }

  if (enderecoSelecionadoId) {
    const end = addresses.find(a => a.id === enderecoSelecionadoId);
    if (end) aplicarFrete(end);
  }

  form.addEventListener("change", async () => {
    const selId = parseInt(form.addressId.value);
    const sel = addresses.find(a => a.id === selId);
    if (!sel) return;
    aplicarFrete(sel);

    try {
      await fetch("/api/Cart/AtualizarEnderecoEFrete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrinhoId,
          enderecoId: sel.id,
          frete: sel.frete
        })
      });
    } catch {
      console.warn("Erro ao atualizar endereço/frete no backend.");
    }
  });

  if (addresses.length >= 2) addBtn.classList.add("disabled");
  addBtn.onclick = () => {
    if (addresses.length >= 2) {
      swal("Atenção", "Você já cadastrou 2 endereços. Edite-os na sua conta.", "info");
    } else {
      window.location.href = "register-address.html";
    }
  };

  const hasDefault = addresses.some(a => a.padrao);
  if (hasDefault || enderecoSelecionadoId) form.dispatchEvent(new Event("change"));

  nextBtn.onclick = () => {
    if (!enderecoSelecionadoId) {
      return swal("Atenção", "Selecione um endereço de entrega.", "warning");
    }
    window.location.href = `payment.html?addressId=${enderecoSelecionadoId}`;
  };

  hideLoader();
});
