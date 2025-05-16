// js/entrega.js

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
  const fmt         = v => v.toFixed(2).replace(".",",");

  backBtn.onclick = () => history.back();

  const whatsapp  = localStorage.getItem("bgHouse_whatsapp");
  const nome      = localStorage.getItem("bgHouse_name")  || "Você";
  const lojaId    = parseInt(localStorage.getItem("bgHouse_lojaId"));
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  const usuarioId = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;

  if (!whatsapp || !usuarioId || !lojaId) {
    await swal("Sessão expirada", "Por favor, identifique-se novamente.", "warning");
    return window.location.href = "identify.html?return=entrega.html";
  }

  userNameEl.textContent  = nome;
  userPhoneEl.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');

  let cart, subtotal = 0, desconto = 0, frete = 0;
  try {
    cart = await fetchCart(whatsapp);
    subtotal = cart.items.reduce((sum, item) => {
      const base = item.precoUnitario * item.quantidade;
      const adicionaisTotal = (item.adicionais || [])
        .reduce((s2, ad) => s2 + ad.preco * ad.quantidade, 0);
      return sum + base + adicionaisTotal;
    }, 0);
    subtotalEl.textContent = `R$ ${fmt(subtotal)}`;
  } catch {
    subtotalEl.textContent = `R$ 0,00`;
  }

  // Cupom
  cupomLine.style.display = "none";
  const savedCupom = localStorage.getItem("bgHouse_appliedCoupon");
  if (savedCupom && usuarioId && lojaId && subtotal > 0) {
    const res = await calcularCupom(savedCupom, usuarioId, lojaId, subtotal);
    if (res.sucesso) {
      desconto = res.dados;
      cupomLine.style.display = "flex";
      cupomValue.textContent  = `- R$ ${fmt(desconto)}`;
    } else {
      localStorage.removeItem("bgHouse_appliedCoupon");
    }
  }

  // Endereços
  const addresses = await fetchUserAddresses(whatsapp);
  form.innerHTML = "";
  addresses.forEach(addr => {
    const lbl = document.createElement("label");
    lbl.className = "address-option" + (addr.padrao ? " address-default" : "");
    lbl.innerHTML = `
      <input type="radio" name="addressId" value="${addr.id}" ${addr.padrao?"checked":""}/>
      <div class="address-label">
        <div>${addr.rua}, ${addr.numero}</div>
        ${addr.referencia?`<div><i>${addr.referencia}</i></div>`:""}
        <small>${addr.bairro} - ${addr.cidade}/${addr.uf}</small>
        <small>${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • Frete R$ ${fmt(addr.frete)}</small>
      </div>`;
    form.appendChild(lbl);
  });

  const hasDefault = addresses.some(a => a.padrao);
  nextBtn.textContent = hasDefault ? "Ir Para Pagamento" : "Escolha a Entrega!";
  nextBtn.disabled    = !hasDefault;
  nextBtn.classList.toggle("disabled", !hasDefault);

  if (addresses.length >= 2) addBtn.classList.add("disabled");
  addBtn.onclick = () => {
    if (addresses.length >= 2) {
      swal("Atenção","Você já cadastrou 2 endereços. Edite-os na sua conta.","info");
    } else {
      window.location.href="register-address.html";
    }
  };

  form.addEventListener("change", () => {
    const selId = form.addressId.value;
    document.querySelectorAll(".address-option").forEach(l => {
      l.classList.toggle("selected",
        l.querySelector("input").value === selId
      );
    });
    nextBtn.disabled = false;
    nextBtn.classList.remove("disabled");
    nextBtn.textContent = "Ir Para Pagamento";

    const sel = addresses.find(a => a.id === +selId);
    if (sel) {
      frete = sel.frete;
      freteEl.textContent    = frete > 0 ? `R$ ${fmt(frete)}` : '–';
      finalTotal.textContent = `R$ ${fmt(subtotal - desconto + frete)}`;
      localStorage.setItem("bgHouse_frete", frete.toFixed(2));
      localStorage.setItem("bgHouse_selectedAddress", JSON.stringify(sel));
    }
  });

  if (hasDefault) {
    form.dispatchEvent(new Event("change"));
  }

  nextBtn.onclick = () => {
    if (!addresses.length) {
      return swal("Atenção","Cadastre um endereço primeiro.","warning");
    }
    const selId = form.addressId.value;
    if (!selId && !hasDefault) {
      return swal("Atenção","Selecione um endereço de entrega.","warning");
    }
    window.location.href = `payment.html?addressId=${selId || addresses.find(a=>a.padrao).id}`;
  };
});
