// js/cart.js
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

document.addEventListener("DOMContentLoaded", async () => {
  const loading     = document.getElementById("loadingOverlay");
  const backBtn     = document.getElementById("backBtn");
  const cartList    = document.getElementById("cartList");
  const subtotalEl  = document.getElementById("subtotal");
  const totalEl     = document.getElementById("total");
  const nextBtn     = document.getElementById("nextBtn");
  const couponInput = document.getElementById("couponCode");
  const applyBtn    = document.getElementById("applyCoupon");
  const loyaltyDots = document.querySelectorAll(".loyalty-progress .dot");
  const fmt         = v => v.toFixed(2).replace(".",",");

  if (couponInput) {
    couponInput.addEventListener("input", e => {
      const tgt = e.target;
      const start = tgt.selectionStart;
      const end   = tgt.selectionEnd;
      tgt.value = tgt.value.toUpperCase();
      tgt.setSelectionRange(start, end);
    });
  }
  backBtn.onclick = () => {
    window.location.href = "index.html";
  };
  

  // 1) Credenciais mínimas
  const whatsapp     = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  const usuarioId    = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
  if (!whatsapp || !usuarioId) {
    return swal("Ops!", "Identifique-se para ver o carrinho.", "warning")
      .then(() => window.location.href = "identify.html?return=cart.html");
  }

  // 2) IDs de loja/fidelidade: se faltando, recarrega via API
  let lojaId       = parseInt(localStorage.getItem("bgHouse_lojaId"));
  let programaId   = parseInt(localStorage.getItem("bgHouse_fidelidadeId"));
  if (!lojaId || !programaId) {
    try {
      const info = await fetchInfoLoja();
      lojaId     = info.lojaId;
      programaId = info.programaFidelidadeId;
    } catch {
      return swal("Ops!", "Erro ao obter informações da loja.", "error");
    }
  }

  let subtotal = 0, desconto = 0;

  // Fecha todos os popovers
  const fecharPopovers = () =>
    document.querySelectorAll(".popover").forEach(p => p.classList.add("hidden"));

  // Fecha popover ao clicar fora
  document.addEventListener("click", e => {
    if (!e.target.closest(".item-info")) fecharPopovers();
  });

  // Função principal: (re)renderiza o carrinho
  async function carregarCarrinho() {
    loading.classList.remove("hidden");
    try {
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (!resp.ok) throw new Error();
      const cart = await resp.json();

      if (!cart.items.length) {
        localStorage.removeItem("bgHouse_appliedCoupon");
        return window.location.href = "index.html";
      }

      cartList.innerHTML = "";
      subtotal = 0;
      for (const item of cart.items) {
        subtotal += item.precoUnitario * item.quantidade;
        const tr = document.createElement("tr");
        tr.className  = "item-row";
        tr.dataset.id = item.itemId;
        tr.innerHTML = `
          <td>
            <div class="item-info">
              <span class="item-label">
                <button class="qty-btn decrease" data-id="${item.itemId}">−</button>
                <span class="qty">${item.quantidade}</span>
                <button class="qty-btn increase" data-id="${item.itemId}">+</button>
                × <span class="product-name">${item.produtoNome}</span>
              </span>
              <button class="edit-btn" data-id="${item.itemId}">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <div class="popover hidden" data-id="${item.itemId}">
                <button class="confirm-remove">
                  <i class="fas fa-trash-alt"></i> Excluir
                </button>
              </div>
            </div>
          </td>
          <td>R$ ${item.precoUnitario.toFixed(2).replace(".",",")}</td>`;
        cartList.appendChild(tr);
      }
      atualizarResumo();
    } catch {
      swal("Erro", "Não foi possível carregar seu carrinho.", "error");
    } finally {
      loading.classList.add("hidden");
    }
  }

  function atualizarResumo() {
    subtotalEl.textContent = `+ R$ ${fmt(subtotal)}`;
    totalEl.textContent    = `R$ ${fmt(subtotal - desconto)}`;
  }

  // Eventos dentro do carrinho: quantidade, popover e remoção
  cartList.addEventListener("click", async e => {
    const dec = e.target.closest(".qty-btn.decrease");
    const inc = e.target.closest(".qty-btn.increase");
    if (dec || inc) {
      const btn    = dec || inc;
      const itemId = parseInt(btn.dataset.id);
      const row    = btn.closest(".item-row");
      const qtyEl  = row.querySelector(".qty");
      let qty      = parseInt(qtyEl.textContent) + (inc ? 1 : -1);

      loading.classList.remove("hidden");
      try {
        await fetch(
          `/api/Cart/UpdateItemQuantity?whatsapp=${encodeURIComponent(whatsapp)}`, {
            method: "POST",
            headers: { "Content-Type":"application/json" },
            body: JSON.stringify({ itemId, quantidade: qty })
          }
        );
        await carregarCarrinho();
        await aplicarCupomSalvo();
        await carregarFidelidade();
      } catch {
        swal("Erro", "Não foi possível atualizar a quantidade.", "error");
      } finally {
        loading.classList.add("hidden");
      }
      return;
    }

    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      e.stopPropagation();
      const pop = document.querySelector(`.popover[data-id="${editBtn.dataset.id}"]`);
      pop.classList.toggle("hidden");
      return;
    }

    const rem = e.target.closest(".confirm-remove");
    if (rem) {
      const pop    = rem.closest(".popover");
      const itemId = pop.dataset.id;
      pop.classList.add("hidden");
      const willDelete = await swal({
        title: "Remover item?",
        text:  "Deseja mesmo apagar este item do carrinho?",
        icon:  "warning",
        buttons:["Não","Sim"],
        dangerMode:true
      });
      if (!willDelete) return;

      loading.classList.remove("hidden");
      try {
        const del = await fetch(
          `/api/Cart/RemoveItem/${itemId}?whatsapp=${encodeURIComponent(whatsapp)}`,
          { method: "DELETE" }
        );
        if (!del.ok) throw new Error();
        await carregarCarrinho();
        await aplicarCupomSalvo();
        await carregarFidelidade();
      } catch {
        swal("Erro", "Não foi possível remover o item.", "error");
      } finally {
        loading.classList.add("hidden");
      }
    }
  });

  // Aplica cupom salvo
  async function aplicarCupomSalvo() {
    const codigo = localStorage.getItem("bgHouse_appliedCoupon");
    if (!codigo) return;
    try {
      const resp = await fetch("/api/Cupom/CalcularDesconto", {
        method: "POST",
        headers:{"Accept":"application/json","Content-Type":"application/json"},
        body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
      });
      const data = await resp.json();
      if (data.sucesso) {
        desconto             = data.dados;
        couponInput.value    = codigo;
        couponInput.disabled = true;
        applyBtn.disabled    = true;
        atualizarResumo();
      } else {
        localStorage.removeItem("bgHouse_appliedCoupon");
      }
    } catch {
      // silencioso
    }
  }

  // Verificar cupom novo
  applyBtn.onclick = async () => {
    const codigo = couponInput.value.trim();
    if (!codigo) {
      swal("Atenção","Informe o código do cupom.","warning");
      return;
    }
    loading.classList.remove("hidden");
    desconto = 0;
    try {
      const resp = await fetch("/api/Cupom/CalcularDesconto", {
        method: "POST",
        headers:{"Accept":"application/json","Content-Type":"application/json"},
        body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
      });
      const data = await resp.json();
      if (!data.sucesso) {
        swal("Erro", data.mensagem, "error");
        return;
      }
      desconto = data.dados;
      atualizarResumo();
      swal("Sucesso", `Cupom aplicado: R$ ${fmt(desconto)}`, "success");
      couponInput.disabled = true;
      applyBtn.disabled    = true;
      localStorage.setItem("bgHouse_appliedCoupon", codigo);
    } catch {
      swal("Erro","Não foi possível validar o cupom.","error");
    } finally {
      loading.classList.add("hidden");
    }
  };

  // Progresso de fidelidade
  async function carregarFidelidade() {
    try {
      const resp = await fetch(
        `/api/UsuarioFidelidade/Pontos?usuarioId=${usuarioId}&fidelidadeId=${programaId}`
      );
      if (!resp.ok) return;
      const pontos = await resp.json();
      loyaltyDots.forEach((dot,i) => dot.classList.toggle("filled", i < pontos));
    } catch {}
  }

  nextBtn.onclick = () => { 
    window.location.href = "entrega.html";
  };

  // Inicialização
  await carregarCarrinho();
  await aplicarCupomSalvo();
  await carregarFidelidade();
});
