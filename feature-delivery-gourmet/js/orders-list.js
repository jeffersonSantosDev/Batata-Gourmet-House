// js/orders-list.js
document.addEventListener("DOMContentLoaded", () => {
    const backBtn     = document.getElementById("backBtn");
    const tableBody   = document.getElementById("ordersTableBody");
    const noPedidos   = document.getElementById("noPedidos");
  
    // 1) Seed de um pedido fictício, se ainda não existir
    if (!localStorage.getItem("bgHouse_orders")) {
      localStorage.setItem("bgHouse_orders", JSON.stringify([
        { id: 1, date: "22/04/2025", total: "R$ 27,00" }
      ]));
    }
  
    // 2) Verifica identificação (identify.js)
    if (typeof window.identifyUser === "function" && !window.identifyUser()) {
      return; // redirect já ocorreu
    }
  
    // 3) Botão voltar
    backBtn.addEventListener("click", () => {
      history.length > 1 ? history.back() : window.location.href = "/";
    });
  
    // 4) Carrega e exibe pedidos
    const pedidos = JSON.parse(localStorage.getItem("bgHouse_orders") || "[]");
    if (!pedidos.length) {
      noPedidos.classList.remove("hidden");
      return;
    }
    pedidos.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.date}</td>
        <td>${p.total}</td>
        <td>
          <a href="order.html?id=${p.id}" class="pedido-link">
            Ver Pedido
          </a>
        </td>`;
      tableBody.appendChild(tr);
    });
  });
  