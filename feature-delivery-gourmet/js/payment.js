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
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ numero: whatsapp })
    });
    if (resp.status === 204) return [];
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error(err);
    await swal("Erro","Não foi possível carregar seus endereços.","error");
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
    method:'POST',
    headers:{ 'Content-Type':'application/json','Accept':'application/json' },
    body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
  });
  if (!resp.ok) return { sucesso:false };
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

  // Credenciais
  const whatsapp  = localStorage.getItem("bgHouse_whatsapp");
  const nome      = localStorage.getItem("bgHouse_name")  || "Você";
  const lojaId    = parseInt(localStorage.getItem("bgHouse_lojaId"));
  const usuarioId = localStorage.getItem("bgHouse_id")
                     ? parseInt(atob(localStorage.getItem("bgHouse_id")))
                     : null;

  if (!whatsapp || !usuarioId) {
    await swal("Ops!","Identifique-se.","warning");
    return window.location.href = 'identify.html?return=entrega.html';
  }
  userNameEl.textContent  = nome;
  userPhoneEl.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');

  // 1) Carrinho
  let cart, subtotal = 0, desconto = 0, frete = 0;
  try {
    cart = await fetchCart(whatsapp);
    subtotal = cart.items.reduce((s,i)=> s + i.precoUnitario*i.quantidade,0);
    subtotalEl.textContent = `R$ ${fmt(subtotal)}`;
  } catch {
    subtotalEl.textContent = `R$ 0,00`;
  }

  // 2) Cupom
  const savedCupom = localStorage.getItem("bgHouse_appliedCoupon");
  if (savedCupom) {
    const res = await calcularCupom(savedCupom, usuarioId, lojaId, subtotal);
    if (res.sucesso) {
      desconto = res.dados;
      cupomLine.style.display = "flex";
      cupomValue.textContent  = `- R$ ${fmt(desconto)}`;
    } else {
      localStorage.removeItem("bgHouse_appliedCoupon");
    }
  }

  // 3) Endereços
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

  // 4) Estado inicial do botão
  const hasDefault = addresses.some(a=>a.padrao);
  nextBtn.textContent = hasDefault ? "Ir Para Pagamento" : "Escolha a Entrega!";
  nextBtn.disabled    = !hasDefault;
  nextBtn.classList.toggle("disabled", !hasDefault);

  // 5) Adicionar endereço
  if (addresses.length >= 2) addBtn.classList.add("disabled");
  addBtn.onclick = () => {
    if (addresses.length >= 2) {
      swal("Atenção","Você já cadastrou 2 endereços. Edite-os na sua conta.","info");
    } else {
      window.location.href="register-address.html";
    }
  };

  // 6) Quando muda seleção de endereço, recalcula e salva o frete
  form.addEventListener("change", () => {
    const selId = form.addressId.value;
    // visual
    document.querySelectorAll(".address-option").forEach(l => {
      l.classList.toggle("selected",
        l.querySelector("input").value === selId
      );
    });
    // habilita + altera texto
    nextBtn.disabled = false;
    nextBtn.classList.remove("disabled");
    nextBtn.textContent = "Ir Para Pagamento";
    // pega dados do endereço selecionado
    const sel = addresses.find(a => a.id === +selId);
    if (sel) {
      frete = sel.frete;
      // atualiza na tela
      freteEl.textContent    = `R$ ${fmt(frete)}`;
      finalTotal.textContent = `R$ ${fmt(subtotal - desconto + frete)}`;
      // salva no localStorage para a próxima página
      localStorage.setItem("bgHouse_frete", frete.toFixed(2));
    }
  });

  // dispara se tiver padrão para já exibir
  if (hasDefault) form.dispatchEvent(new Event("change"));

  // 7) Clique em Próximo
  nextBtn.onclick = () => {
    if (addresses.length === 0) {
      return swal("Atenção","Cadastre um endereço primeiro.","warning");
    }
    const selId = form.addressId.value;
    if (!selId && !hasDefault) {
      return swal("Atenção","Selecione um endereço de entrega.","warning");
    }
    // redireciona para pagamento (addressId é lido lá, e frete já está em localStorage)
    window.location.href = `payment.html?addressId=${selId || addresses.find(a=>a.padrao).id}`;
  };
});
