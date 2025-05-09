const loadingOverlay = document.getElementById("loadingOverlay");
document.addEventListener("DOMContentLoaded", async () => {
  setTimeout(async () => {
    if (!identifyUser()) {
      const folder = location.pathname.replace(/[^/]+$/, "");
      const returnTo = location.pathname.split("/").pop();
      window.location.href = `${folder}identify.html?return=${returnTo}`;
      return;
    }

    const backBtn = document.getElementById("backBtn"); 
    const tableBody = document.getElementById("ordersTableBody");
    const noPedidos = document.getElementById("noPedidos"); 
   

    if (backBtn) {
      backBtn.addEventListener("click", () => { 
        if (history.length > 1) {
          history.back();
        } 
      });
    } else {
      console.warn("Botão de voltar não encontrado");
    }
    const numero = localStorage.getItem("bgHouse_whatsapp");
    showLoading();
    try {
      const response = await fetch("/api/Usuario/GetPedidosByWhatsAppAsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero })
      });

      if (!response.ok) throw new Error("Falha ao buscar pedidos");

      const pedidos = await response.json();

      if (!pedidos.length) {
        hideLoading();
        noPedidos.classList.remove("hidden");
        return;
      }
      hideLoading();
      pedidos.forEach(p => {
        const data = new Date(p.criadoEm).toLocaleDateString("pt-BR");
      
        // formata números no padrão pt-BR
        const fmt = num => num.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${data}</td>
          <td>
            <div class="order-breakdown">
              <span>Sub:</span>
              <span class="val sub">R$ ${fmt(p.subtotal)}</span>
              <span>Frete:</span>
              <span class="val freight">R$ ${fmt(p.frete)}</span>
            </div>
            <div class="order-total">
              Total: <span class="val total">R$ ${fmt(p.total)}</span>
            </div>
          </td>
          <td>
            <a href="order.html?id=${p.pedidoId}" class="pedido-link">Ver Pedido</a>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      hideLoading();
      console.error("Erro ao carregar pedidos:", err);
      swal("Erro", "Não foi possível carregar seus pedidos. Tente novamente mais tarde.", "error");
    }
 
   
  }, 150); // pequeno delay para garantir que localStorage esteja disponível
});

function showLoading() {
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}
