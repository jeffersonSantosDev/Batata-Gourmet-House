document.addEventListener("DOMContentLoaded", async () => {
    const loading = document.getElementById("loadingOverlay");
    const backBtn  = document.getElementById("backBtn");
    const cartList = document.getElementById("cartList");
    const subtotalEl  = document.getElementById("subtotal");
    const totalEl     = document.getElementById("total");
    const nextBtn     = document.getElementById("nextBtn");
    const whatsapp    = localStorage.getItem("bgHouse_whatsapp");
  
    backBtn.onclick = () => history.back();
  
    if (!whatsapp) {
      swal("Ops!", "Identifique-se para ver o carrinho.", "warning")
        .then(() => window.location.href = "identify.html?return=cart.html");
      return;
    }
  
    try {
      // mostra loading enquanto carrega
      loading.classList.remove("hidden");
  
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (!resp.ok) throw new Error();
      const cart = await resp.json();
  
      cartList.innerHTML = "";
      if (!cart.items.length) {
        cartList.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem">Seu carrinho está vazio.</td></tr>`;
        nextBtn.disabled = true;
        return;
      }
  
      // popula linhas com X de remover
      cart.items.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "item-row";
        tr.innerHTML = `
          <td>
            <span>${item.quantidade}× ${item.produtoNome}</span>
            ${item.observacoes ? `<small>“${item.observacoes}”</small>` : ""}
          </td>
          <td>
            R$ ${item.precoUnitario.toFixed(2).replace(".",",")}
            <button class="edit-btn" data-id="${item.itemId}" title="Opções">
  <i class="fas fa-pencil-alt"></i>
</button>

          </td>
        `;
        cartList.appendChild(tr);
      });
  
      // calcula valores
      const subtotal = cart.items.reduce((s,i)=> s + (i.precoUnitario * i.quantidade), 0);
      subtotalEl.textContent = `+ R$ ${subtotal.toFixed(2).replace(".",",")}`;
      totalEl.textContent    = `R$ ${subtotal.toFixed(2).replace(".",",")}`;
  
      // ao clicar em × pergunta e remove
      cartList.addEventListener("click", e => {
        const btn = e.target.closest(".remove-btn");
        if (!btn) return;
        const itemId = btn.dataset.id;
        swal({
          title: "Remover item?",
          text: "Deseja mesmo apagar este item do carrinho?",
          icon: "warning",
          buttons: ["Cancelar","Sim"],
          dangerMode: true
        }).then(async willDelete => {
          if (!willDelete) return;
  
          try {
            loading.classList.remove("hidden");
            const del = await fetch(
              `/api/Cart/RemoveItem/${itemId}?whatsapp=${encodeURIComponent(whatsapp)}`,
              { method: "DELETE" }
            );
            if (!del.ok) throw new Error();
  
            // recarrega ou, se ficou vazio, volta pra home
            const remaining = cart.items.filter(i => i.itemId != itemId).length;
            if (remaining === 0) {
              window.location.href = "index.html";
            } else {
              window.location.reload();
            }
          } catch (err) {
            console.error("Erro ao remover item:", err);
            swal("Erro", "Não foi possível remover o item.", "error");
          } finally {
            loading.classList.add("hidden");
          }
        });
      });
  
      // próximo passo
      nextBtn.onclick = () => window.location.href = "checkout.html";
  
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
      swal("Erro", "Não foi possível carregar seu carrinho.", "error");
    } finally {
      loading.classList.add("hidden");
    }
  });
  