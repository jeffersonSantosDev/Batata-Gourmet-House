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

  // 1) Recupera credenciais e IDs de loja/fidelidade
  const whatsapp       = localStorage.getItem("bgHouse_whatsapp");
  const usuarioIdEnc   = localStorage.getItem("bgHouse_id");
  const usuarioId      = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
  const lojaId         = parseInt(localStorage.getItem("bgHouse_lojaId"));
  const fidelidadeId   = parseInt(localStorage.getItem("bgHouse_fidelidadeId"));

  backBtn.onclick = () => history.back();

  if (!whatsapp || !usuarioId || !lojaId || !fidelidadeId) {
    swal("Ops!", "Identifique-se novamente.", "warning")
      .then(() => window.location.href = "identify.html?return=cart.html");
    return;
  }

  let subtotal = 0;
  let desconto = 0;
  const fmt = v => v.toFixed(2).replace(".",",");

  try {
    loading.classList.remove("hidden");
    const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
    if (!resp.ok) throw new Error();
    const cart = await resp.json();

    // Renderiza itens
    cartList.innerHTML = "";
    if (!cart.items.length) {
      cartList.innerHTML = `
        <tr><td colspan="2" style="text-align:center; padding:1rem">
          Seu carrinho está vazio.
        </td></tr>`;
      nextBtn.disabled = true;
      return;
    }
    cart.items.forEach(item => {
      const tr = document.createElement("tr");
      tr.className = "item-row";
      tr.innerHTML = `
        <td>
          <div class="item-info">
            <span>${item.quantidade}× ${item.produtoNome}</span>
            <button class="edit-btn" data-id="${item.itemId}" title="Opções">
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

    // Calcula subtotal e total
    subtotal = cart.items.reduce((sum,i) => sum + i.precoUnitario * i.quantidade, 0);
    const atualizarResumo = () => {
      subtotalEl.textContent = `+ R$ ${fmt(subtotal)}`;
      totalEl.textContent    = `R$ ${fmt(subtotal - desconto)}`;
    };
    atualizarResumo();

    // Fecha popovers ao clicar fora
    document.addEventListener("click", e => {
      if (!e.target.closest(".item-info"))
        document.querySelectorAll(".popover")
          .forEach(p => p.classList.add("hidden"));
    });

    // Remoção de item
    cartList.addEventListener("click", async e => {
      const editBtn = e.target.closest(".edit-btn");
      if (editBtn) {
        e.stopPropagation();
        const id = editBtn.dataset.id;
        document.querySelectorAll(".popover").forEach(p => p.classList.add("hidden"));
        editBtn.parentNode.querySelector(`.popover[data-id="${id}"]`)
               .classList.toggle("hidden");
        return;
      }
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
          window.location.reload();
        } catch {
          swal("Erro", "Não foi possível remover o item.", "error");
        } finally {
          loading.classList.add("hidden");
        }
      }
    });

    // 2) Se há cupom salvo, simula aplicação automática
    const savedCoupon = localStorage.getItem("bgHouse_appliedCoupon");
    if (savedCoupon) {
      loading.classList.remove("hidden");
      try {
        const respC = await fetch("/api/Cupom/CalcularDesconto", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            codigo:        savedCoupon,
            usuarioId:     usuarioId,
            lojaId:        lojaId,
            valorOriginal: subtotal
          })
        });
        const dataC = await respC.json();
        if (dataC.sucesso) {
          desconto = dataC.dados;
          couponInput.value = savedCoupon;
          couponInput.disabled = true;
          applyBtn.disabled    = true;
          atualizarResumo();
        } else {
          // cupom expirado ou inválido, limpa o storage
          localStorage.removeItem("bgHouse_appliedCoupon");
        }
      } catch {
        // falha silenciosa
      } finally {
        loading.classList.add("hidden");
      }
    }

    // 3) Clique em Verificar cupom: aplica e salva em localStorage
    applyBtn.onclick = async () => {
      const codigo = couponInput.value.trim();
      if (!codigo) {
        swal("Atenção", "Informe o código do cupom.", "warning");
        return;
      }
      loading.classList.remove("hidden");
      try {
        const resp = await fetch("/api/Cupom/CalcularDesconto", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            codigo:        codigo,
            usuarioId:     usuarioId,
            lojaId:        lojaId,
            valorOriginal: subtotal
          })
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

    // 4) Carregar progresso de fidelidade
    try {
      const r2 = await fetch(
        `/api/UsuarioFidelidade/Pontos?usuarioId=${usuarioId}&fidelidadeId=${fidelidadeId}`
      );
      if (r2.ok) {
        const pontos = await r2.json();
        loyaltyDots.forEach((dot,i) => {
          dot.classList.toggle("filled", i < pontos);
        });
      }
    } catch {}

    // 5) Próximo (checkout)
    nextBtn.onclick = () => window.location.href = "checkout.html";

  } catch (err) {
    console.error("Erro ao carregar carrinho:", err);
    swal("Erro", "Não foi possível carregar seu carrinho.", "error");
  } finally {
    loading.classList.add("hidden");
  }
});
