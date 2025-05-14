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

  // Recupera credenciais e IDs
  const whatsapp     = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc = localStorage.getItem("bgHouse_id");
  const usuarioId    = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
  const lojaId       = parseInt(localStorage.getItem("bgHouse_lojaId"));
  const programaId   = parseInt(localStorage.getItem("bgHouse_fidelidadeId"));
  const fmt          = v => v.toFixed(2).replace(".",",");

  backBtn.onclick = () => history.back();

  if (!whatsapp || !usuarioId || !lojaId || !programaId) {
    swal("Ops!", "Identifique-se novamente.", "warning")
      .then(() => window.location.href = "identify.html?return=cart.html");
    return;
  }

  let subtotal = 0, desconto = 0;

  // Função para (re)carregar e renderizar o carrinho
  async function carregarCarrinho() {
    loading.classList.remove("hidden");
    try {
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (!resp.ok) throw new Error();
      const cart = await resp.json();

      // se não houver itens, volta à tela inicial
      if (!cart.items || cart.items.length === 0) {
        localStorage.removeItem("bgHouse_appliedCoupon");
        window.location.href = "index.html";
        return;
      }

      // monta a lista de itens
      cartList.innerHTML = "";
      cart.items.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "item-row";
        tr.dataset.id = item.itemId;
        tr.innerHTML = `
          <td>
            <div class="item-info">
              <span>${item.quantidade}× ${item.produtoNome}</span>
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

      // subtotal e total
      subtotal = cart.items.reduce((s,i) => s + i.precoUnitario * i.quantidade, 0);
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

  // manipula popovers e remoção de item sem reload de página
  cartList.addEventListener("click", async e => {
    // toggle popover
    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      e.stopPropagation();
      const id = editBtn.dataset.id;
      document.querySelectorAll(".popover").forEach(p => p.classList.add("hidden"));
      editBtn.parentNode.querySelector(`.popover[data-id="${id}"]`)
             .classList.toggle("hidden");
      return;
    }

    // remover item
    const remBtn = e.target.closest(".confirm-remove");
    if (remBtn) {
      const pop = remBtn.closest(".popover");
      const itemId = pop.dataset.id;
      pop.classList.add("hidden");
      const willDelete = await swal({
        title: "Remover item?",
        text: "Deseja mesmo apagar este item do carrinho?",
        icon: "warning",
        buttons: ["Não","Sim"],
        dangerMode: true
      });
      if (!willDelete) return;

      loading.classList.remove("hidden");
      try {
        const del = await fetch(
          `/api/Cart/RemoveItem/${itemId}?whatsapp=${encodeURIComponent(whatsapp)}`,
          { method: "DELETE" }
        );
        if (!del.ok) throw new Error();
        // após remoção, recarrega carrinho e reaplica cupom se houver
        await carregarCarrinho();
        await aplicarCupomSalvo(); 
      } catch {
        swal("Erro", "Não foi possível remover o item.", "error");
      } finally {
        loading.classList.add("hidden");
      }
    }
  });

  // tenta aplicar cupom salvo
  async function aplicarCupomSalvo() {
    const codigo = localStorage.getItem("bgHouse_appliedCoupon");
    if (!codigo) return;
    try {
      const resp = await fetch("/api/Cupom/CalcularDesconto", {
        method: "POST",
        headers: {"Accept":"application/json","Content-Type":"application/json"},
        body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
      });
      const data = await resp.json();
      if (data.sucesso) {
        desconto = data.dados;
        couponInput.value = codigo;
        couponInput.disabled = true;
        applyBtn.disabled = true;
        atualizarResumo();
      } else {
        localStorage.removeItem("bgHouse_appliedCoupon");
      }
    } catch {
      // silencioso
    }
  }

  // botão verificar cupom
  applyBtn.onclick = async () => {
    const codigo = couponInput.value.trim();
    if (!codigo) {
      swal("Atenção", "Informe o código do cupom.", "warning");
      return;
    }
    loading.classList.remove("hidden");
    desconto = 0;
    try {
      const resp = await fetch("/api/Cupom/CalcularDesconto", {
        method: "POST",
        headers: {"Accept":"application/json","Content-Type":"application/json"},
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
      swal("Erro", "Não foi possível validar o cupom.", "error");
    } finally {
      loading.classList.add("hidden");
    }
  };

  // progresso de fidelidade
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

  // próximo
  nextBtn.onclick = () => window.location.href = "checkout.html";

  // inicialização
  await carregarCarrinho();
  await aplicarCupomSalvo();
  await carregarFidelidade();
});
