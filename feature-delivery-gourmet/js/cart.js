document.addEventListener("DOMContentLoaded", async () => {
    const loading   = document.getElementById("loadingOverlay");
    const backBtn   = document.getElementById("backBtn");
    const cartList  = document.getElementById("cartList");
    const subtotalEl= document.getElementById("subtotal");
    const totalEl   = document.getElementById("total");
    const nextBtn   = document.getElementById("nextBtn");
    const whatsapp  = localStorage.getItem("bgHouse_whatsapp");
  
    backBtn.onclick = () => history.back();
  
    if (!whatsapp) {
      swal("Ops!", "Identifique-se para ver o carrinho.", "warning")
        .then(() => window.location.href = "identify.html?return=cart.html");
      return;
    }
  
    try {
      loading.classList.remove("hidden");
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (!resp.ok) throw new Error();
      const cart = await resp.json();
  
      cartList.innerHTML = "";
      if (!cart.items.length) {
        cartList.innerHTML = `
          <tr><td colspan="2" style="text-align:center; padding:1rem">
            Seu carrinho está vazio.
          </td></tr>`;
        nextBtn.disabled = true;
        return;
      }
  
      // Renderiza cada linha com popover já oculto
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
          <td>
            R$ ${item.precoUnitario.toFixed(2).replace(".",",")}
          </td>`;
        cartList.appendChild(tr);
      });
  
      // Calcula subtotal e total
      const subtotal = cart.items.reduce((sum,i) => sum + i.precoUnitario * i.quantidade, 0);
      subtotalEl.textContent = `+ R$ ${subtotal.toFixed(2).replace(".",",")}`;
      totalEl.textContent    = `R$ ${subtotal.toFixed(2).replace(".",",")}`;
  
      // Fecha popovers ao clicar fora
      document.addEventListener("click", e => {
        if (!e.target.closest(".item-info")) {
          document.querySelectorAll(".popover")
            .forEach(p => p.classList.add("hidden"));
        }
      });
  
      // Lógica de popover e remoção
      cartList.addEventListener("click", e => {
        // 1) Clique no lápis: só toggle popover
        const editBtn = e.target.closest(".edit-btn");
        if (editBtn) {
          e.stopPropagation();
          const id = editBtn.dataset.id;
          // fecha outros e abre o correto
          document.querySelectorAll(".popover").forEach(p => p.classList.add("hidden"));
          const pop = editBtn.parentNode.querySelector(`.popover[data-id="${id}"]`);
          pop.classList.toggle("hidden");
          return;
        }
  
        // 2) Clique em "Excluir" no popover
        const remBtn = e.target.closest(".confirm-remove");
        if (remBtn) {
          const pop = remBtn.closest(".popover");
          const itemId = pop.dataset.id;
          pop.classList.add("hidden");
  
          // confirmação final
          swal({
            title: "Remover item?",
            text: "Deseja mesmo apagar este item do carrinho?",
            icon: "warning",
            buttons: ["Não","Sim"],
            dangerMode: true
          }).then(async willDelete => {
            if (!willDelete) return;
  
            loading.classList.remove("hidden");
            try {
              const del = await fetch(
                `/api/Cart/RemoveItem/${itemId}?whatsapp=${encodeURIComponent(whatsapp)}`,
                { method: "DELETE" }
              );
              if (!del.ok) throw new Error();
  
              // se ficar vazio, volta pra index
              const remaining = cart.items.filter(i => i.itemId != itemId).length;
              if (remaining === 0) {
                window.location.href = "index.html";
              } else {
                window.location.reload();
              }
            } catch {
              swal("Erro", "Não foi possível remover o item.", "error");
            } finally {
              loading.classList.add("hidden");
            }
          });
        }
      });
  
      nextBtn.onclick = () => window.location.href = "checkout.html";
  
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
      swal("Erro", "Não foi possível carregar seu carrinho.", "error");
    } finally {
      loading.classList.add("hidden");
    }
  });
  