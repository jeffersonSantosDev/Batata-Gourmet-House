document.addEventListener("DOMContentLoaded", async () => {
    const backBtn     = document.getElementById("backBtn");
    const cartList    = document.getElementById("cartList");
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
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (!resp.ok) throw new Error();
      const cart = await resp.json();
  
      if (!cart.items.length) {
        cartList.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:1rem">Seu carrinho está vazio.</td></tr>`;
        nextBtn.disabled = true;
        return;
      }
  
      // popula linhas
      cart.items.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "item-row";
        tr.innerHTML = `
          <td>
            <div class="item-info">
              <span>${item.quantidade}× ${item.produtoNome}</span>
              <button class="remove-btn" data-id="${item.itemId}" title="Remover">&middot;&middot;&middot;</button>
            </div>
            ${item.observacoes ? `<small>“${item.observacoes}”</small>` : ""}
          </td>
          <td>R$ ${item.precoUnitario.toFixed(2).replace(".",",")}</td>
        `;
        cartList.appendChild(tr);
      });
  
      // calcula valores
      const subtotal = cart.items.reduce((s,i)=> s + (i.precoUnitario * i.quantidade), 0);
      subtotalEl.textContent = `+ R$ ${subtotal.toFixed(2).replace(".",",")}`;
      totalEl.textContent    = `R$ ${subtotal.toFixed(2).replace(".",",")}`;
  
      // ação remover
      cartList.addEventListener("click", async e => {
        const btn = e.target.closest(".remove-btn");
        if (!btn) return;
        const itemId = btn.dataset.id;
        await fetch(`/api/Cart/RemoveItem?whatsapp=${encodeURIComponent(whatsapp)}&itemId=${itemId}`, { method: "DELETE" });
        window.location.reload();
      });
  
      // próximo passo
      nextBtn.onclick = () => window.location.href = "checkout.html";
  
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
      swal("Erro", "Não foi possível carregar seu carrinho.", "error");
    }
  });
  