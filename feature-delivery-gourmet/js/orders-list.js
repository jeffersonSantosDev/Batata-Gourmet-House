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

    try {
      const response = await fetch("http://batatagourmethouse.runasp.net/api/Usuario/GetPedidosByWhatsAppAsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero })
      });

      if (!response.ok) throw new Error("Falha ao buscar pedidos");

      const pedidos = await response.json();

      if (!pedidos.length) {
        noPedidos.classList.remove("hidden");
        return;
      }

      pedidos.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${new Date(p.criadoEm).toLocaleDateString("pt-BR")}</td>
          <td>R$ ${p.total.toFixed(2)}</td>
          <td>
            <a href="order.html?id=${p.pedidoId}" class="pedido-link">Ver Pedido</a>
          </td>`;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      swal("Erro", "Não foi possível carregar seus pedidos. Tente novamente mais tarde.", "error");
    }
 
   
  }, 150); // pequeno delay para garantir que localStorage esteja disponível
});
