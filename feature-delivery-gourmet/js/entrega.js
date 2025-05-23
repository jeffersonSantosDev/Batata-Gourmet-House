function showLoader() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

async function fetchInfoLoja() {
  const resp = await fetch('/api/Loja/GetInfoLoja', {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  localStorage.setItem('bgHouse_lojaId', data.lojaId);
  localStorage.setItem('bgHouse_fidelidadeId', data.programaFidelidadeId);
  return data;
}

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

async function fetchCart(whatsapp) {
  const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
  if (!resp.ok) throw new Error('Erro ao carregar carrinho');
  return resp.json();
}

async function calcularCupom(codigo, usuarioId, lojaId, subtotal) {
  const resp = await fetch('/api/Cupom/CalcularDesconto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
  });
  if (!resp.ok) return { sucesso: false };
  return resp.json();
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

  const fmt = v => v.toFixed(2).replace(".", ",");
  backBtn.onclick = () => window.location.href = "cart.html";
  // Verifica se está voltando da identificação
  const urlParams = new URLSearchParams(window.location.search);
  const fromReturn = urlParams.get("return");

  // Dados do usuário
  const whatsapp     = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  let lojaIdRaw = localStorage.getItem("bgHouse_lojaId");
  if (!lojaIdRaw) {
    try {
      const lojaInfo = await fetchInfoLoja();
      lojaIdRaw = lojaInfo.lojaId;
    } catch {
      return swal("Erro", "Não foi possível obter os dados da loja.", "error")
        .then(() => window.location.href = "identify.html?return=entrega.html");
    }
  }
  const nome         = localStorage.getItem("bgHouse_name");
  const usuarioId    = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;

  if (!whatsapp || !usuarioId) {
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
  if (carrinhoId && subtotal > 0 && usuarioId && lojaIdRaw) {
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
              lojaId: parseInt(lojaIdRaw),
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
  }

  // Endereços
  let addresses = [];
  try {
    const resp = await fetch('/api/Usuario/GetAddressesByWhatsApp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: whatsapp })
    });
    if (resp.ok) addresses = await resp.json();
  } catch {
    return swal("Erro", "Não foi possível carregar os endereços.", "error");
  }

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
    localStorage.setItem("bgHouse_selectedAddressId", addr.id);
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
    } finally {
      hideLoader(); // ← Fim do carregamento
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
});
