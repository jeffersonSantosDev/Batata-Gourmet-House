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

  let carrinhoId = null;
  let subtotal = 0, desconto = 0;

  backBtn.onclick = () => window.location.href = "index.html";

  if (couponInput) {
    couponInput.addEventListener("input", e => {
      const tgt = e.target,
            start = tgt.selectionStart, end = tgt.selectionEnd;
      tgt.value = tgt.value.toUpperCase();
      tgt.setSelectionRange(start, end);
    });
  }

  const whatsapp     = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  const usuarioId    = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
  if (!whatsapp || !usuarioId) {
    return swal("Ops!", "Identifique-se para ver o carrinho.", "warning")
      .then(() => window.location.href = "identify.html?return=cart.html");
  }

  let lojaId     = parseInt(localStorage.getItem("bgHouse_lojaId"));
  let programaId = parseInt(localStorage.getItem("bgHouse_fidelidadeId"));
  if (!lojaId || !programaId) {
    try {
      const info = await fetchInfoLoja();
      lojaId     = info.lojaId;
      programaId = info.programaFidelidadeId;
    } catch {
      return swal("Ops!", "Erro ao obter informações da loja.", "error");
    }
  }

  document.addEventListener("click", e => {
    if (!e.target.closest(".item-info")) {
      document.querySelectorAll(".popover").forEach(p => p.classList.add("hidden"));
    }
  });

  async function carregarCarrinho() {
    loading.classList.remove("hidden");
    try {
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (!resp.ok) throw new Error();
      const cart = await resp.json();
      carrinhoId = cart.cartId;

      if (!cart.items.length) {
        return window.location.href = "index.html";
      }

      cartList.innerHTML = "";
      subtotal = 0;

      for (const item of cart.items) {
        const adicionaisTotal = (item.adicionais || [])
          .reduce((sum, ad) => sum + ad.preco * ad.quantidade, 0);

        const lineTotal = (item.precoUnitario * item.quantidade) + adicionaisTotal;
        subtotal += lineTotal;

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
              ${item.adicionais && item.adicionais.length > 0
                ? `<button class="expand-btn" data-id="${item.itemId}">+</button>` : ""}
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
          <td>R$ ${lineTotal.toFixed(2).replace(".",",")}</td>`;
        cartList.appendChild(tr);

        if (item.adicionais && item.adicionais.length > 0) {
          const adTr = document.createElement("tr");
          adTr.className = "item-additionals hidden";
          adTr.dataset.parent = item.itemId;
          const adHtml = item.adicionais.map(ad => {
            const nome = ad.nome?.trim() || `Adicional #${ad.adicionalId}`;
            return `
              <div class="additional-row">
                <small>+ ${ad.quantidade} × ${nome} (R$ ${ad.preco.toFixed(2).replace(".",",")})</small>
              </div>`;
          }).join("");
          adTr.innerHTML = `<td colspan="2" class="additionals-cell">${adHtml}</td>`;
          cartList.appendChild(adTr);
        }
      }

      atualizarResumo();      
      await aplicarCupomDoBanco();
      await carregarFidelidade();
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

  async function aplicarCupomDoBanco() {
    desconto = 0;
    try {
      const resp = await fetch("/api/Cupom/Aplicar", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: couponInput.value.trim(),
          usuarioId,
          lojaId,
          valorOriginal: subtotal,
          carrinhoId
        })
      });
      const data = await resp.json();
      if (data.sucesso) {
        desconto = data.dados;
        couponInput.disabled = true;
        applyBtn.disabled = true;
        atualizarResumo();
      }
    } catch {}
  }

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
      } catch {
        swal("Erro", "Não foi possível atualizar a quantidade.", "error");
      } finally {
        loading.classList.add("hidden");
      }
      return;
    }

    const exp = e.target.closest(".expand-btn");
    if (exp) {
      const id = exp.dataset.id;
      const adRow = cartList.querySelector(`tr.item-additionals[data-parent="${id}"]`);
      if (adRow) {
        adRow.classList.toggle("hidden");
        exp.textContent = adRow.classList.contains("hidden") ? "+" : "−";
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
      const will = await swal({
        title: "Remover item?",
        text:  "Deseja mesmo apagar este item do carrinho?",
        icon:  "warning",
        buttons:["Não","Sim"],
        dangerMode:true
      });
      if (!will) return;

      loading.classList.remove("hidden");
      try {
        const del = await fetch(
          `/api/Cart/RemoveItem/${itemId}?whatsapp=${encodeURIComponent(whatsapp)}`,
          { method: "DELETE" }
        );
        if (!del.ok) throw new Error();
        await carregarCarrinho();
      } catch {
        swal("Erro", "Não foi possível remover o item.", "error");
      } finally {
        loading.classList.add("hidden");
      }
      return;
    }
  });

  applyBtn.onclick = async () => {
    const codigo = couponInput.value.trim();
    if (!codigo) {
      swal("Atenção","Informe o código do cupom.","warning");
      return;
    }
    loading.classList.remove("hidden");
    try {
      const resp = await fetch("/api/Cupom/Aplicar", {
        method: "POST",
        headers: { "Accept":"application/json", "Content-Type":"application/json" },
        body: JSON.stringify({
          codigo,
          usuarioId,
          lojaId,
          valorOriginal: subtotal,
          carrinhoId
        })
      });
      const data = await resp.json();
      if (!data.sucesso) {
        swal("Erro", data.mensagem, "error");
      } else {
        desconto = data.dados;
        couponInput.disabled = true;
        applyBtn.disabled    = true;
        atualizarResumo();
      }
    } catch {
      swal("Erro","Não foi possível validar o cupom.","error");
    } finally {
      loading.classList.add("hidden");
    }
  };

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

  nextBtn.onclick = () => window.location.href = "entrega.html";

  await carregarCarrinho();
  await aplicarCupomDoBanco();
  await carregarFidelidade();
});
