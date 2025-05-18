function showLoader() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.add("hidden");
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

  const whatsapp     = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  const lojaIdRaw    = localStorage.getItem("bgHouse_lojaId");
  const nome         = localStorage.getItem("bgHouse_name");

  const usuarioId = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
  if (!whatsapp || !usuarioId) {
    return swal("Ops!", "Identifique-se para ver o carrinho.", "warning")
      .then(() => window.location.href = "identify.html?return=entrega.html");
  }

  userNameEl.textContent  = nome;
  userPhoneEl.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');

  // Fetch carrinho atualizado
  let cart, subtotal = 0, desconto = 0, frete = 0;
  try {
    const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
    cart = await resp.json();
    subtotal = cart.items.reduce((sum, item) => {
      const base = item.precoUnitario * item.quantidade;
      const adicionaisTotal = (item.adicionais || [])
        .reduce((s2, ad) => s2 + ad.preco * ad.quantidade, 0);
      return sum + base + adicionaisTotal;
    }, 0);
    subtotalEl.textContent = `R$ ${fmt(subtotal)}`;
  } catch {
    subtotalEl.textContent = `R$ 0,00`;
    return swal("Erro", "Não foi possível carregar o carrinho.", "error");
  }

  // Cupom (buscar no banco)
  cupomLine.style.display = "none";
  try {
    const resCupom = await fetch(`/api/Cupom/GetCupomCarrinho?carrinhoId=${cart.cartId}`);
    if (resCupom.ok) {
      const codigo = await resCupom.text();
      if (codigo) {
        const res = await fetch('/api/Cupom/CalcularDesconto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo,
            usuarioId,
            lojaId: parseInt(lojaIdRaw),
            valorOriginal: subtotal
          })
        });
        const json = await res.json();
        if (json.sucesso) {
          desconto = json.dados;
          cupomLine.style.display = "flex";
          cupomValue.textContent  = `- R$ ${fmt(desconto)}`;
        }
      }
    }
  } catch {
    console.warn("Erro ao buscar cupom do carrinho.");
  }

  // Endereços
  form.innerHTML = "";
  let selectedAddressId = null;

  const addresses = cart.endereco ? [cart.endereco] : [];

  addresses.forEach(addr => {
    const lbl = document.createElement("label");
    lbl.className = "address-option selected";
    selectedAddressId = addr.id;

    lbl.innerHTML = `
      <input type="radio" name="addressId" value="${addr.id}" checked />
      <div class="address-label">
        <div>${addr.rua}, ${addr.numero}</div>
        ${addr.referencia ? `<div><i>${addr.referencia}</i></div>` : ""}
        <small>${addr.bairro} - ${addr.cidade}/${addr.uf}</small>
        <small>${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • Frete R$ ${fmt(addr.frete)}</small>
      </div>`;
    form.appendChild(lbl);
  });

  if (addresses.length) {
    frete = addresses[0].frete || cart.frete || 0;
    freteEl.textContent = `R$ ${fmt(frete)}`;
    finalTotal.textContent = `R$ ${fmt(subtotal - desconto + frete)}`;
    nextBtn.disabled = false;
    nextBtn.classList.remove("disabled");
    localStorage.setItem("bgHouse_frete", frete.toFixed(2));
    localStorage.setItem("bgHouse_selectedAddress", JSON.stringify(addresses[0]));
  } else {
    nextBtn.disabled = true;
    nextBtn.classList.add("disabled");
  }

  // Ao mudar endereço (futuramente expandir para múltiplos endereços)
  form.addEventListener("change", async () => {
    const selId = parseInt(form.addressId.value);
    const selected = addresses.find(a => a.id === selId);
    if (!selected) return;

    selectedAddressId = selected.id;
    frete = selected.frete;
    freteEl.textContent = `R$ ${fmt(frete)}`;
    finalTotal.textContent = `R$ ${fmt(subtotal - desconto + frete)}`;
    localStorage.setItem("bgHouse_frete", frete.toFixed(2));
    localStorage.setItem("bgHouse_selectedAddress", JSON.stringify(selected));

    // Atualiza o frete no banco (se já tiver carrinhoId)
    try {
      await fetch('/api/Cart/AtualizarEnderecoEFrete', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrinhoId: cart.cartId,
          enderecoId: selected.id,
          frete
        })
      });
    } catch (e) {
      console.warn("Erro ao salvar endereço e frete no carrinho");
    }
  });

  nextBtn.onclick = () => {
    if (!selectedAddressId) {
      return swal("Atenção", "Selecione um endereço de entrega.", "warning");
    }
    window.location.href = `payment.html?addressId=${selectedAddressId}`;
  };
});
