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

  const whatsapp     = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  const usuarioId    = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
  const lojaId       = parseInt(localStorage.getItem("bgHouse_lojaId"));
  const programaId   = parseInt(localStorage.getItem("bgHouse_fidelidadeId"));

  backBtn.onclick = () => history.back();
  if (!whatsapp || !usuarioId || !lojaId || !programaId) {
    swal("Ops!", "Identifique-se novamente.", "warning")
      .then(() => window.location.href = "identify.html?return=cart.html");
    return;
  }

  let subtotal = 0, desconto = 0;

  const fecharPopovers = () =>
    document.querySelectorAll(".popover").forEach(p => p.classList.add("hidden"));

  document.addEventListener("click", e => {
    if (!e.target.closest(".item-info")) fecharPopovers();
  });

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

      cart.items.forEach(item => {
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
      });

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

  cartList.addEventListener("click", async e => {
    // quantidade
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

    // popover
    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      e.stopPropagation();
      const pop = document.querySelector(`.popover[data-id="${editBtn.dataset.id}"]`);
      pop.classList.toggle("hidden");
      return;
    }

    // remover
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

  // cupom salvo
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
        desconto              = data.dados;
        couponInput.value     = codigo;
        couponInput.disabled  = true;
        applyBtn.disabled     = true;
        atualizarResumo();
      } else {
        localStorage.removeItem("bgHouse_appliedCoupon");
      }
    } catch {
      // silencioso
    }
  }

  // verificar cupom
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

  // fidelidade
  async function carregarFidelidade() {
    try {
      const resp = await fetch(
        `/api/UsuarioFidelidade/Pontos?usuarioId=${usuarioId}&fidelidadeId=${programaId}`
      );
      if (!resp.ok) return;
      const pontos = await resp.json();
      loyaltyDots.forEach((dot,i) => {
        dot.classList.toggle("filled", i < pontos);
      });
    } catch {}
  }

  nextBtn.onclick = () => window.location.href = "checkout.html";

  // Init
  await carregarCarrinho();
  await aplicarCupomSalvo();
  await carregarFidelidade();
});
