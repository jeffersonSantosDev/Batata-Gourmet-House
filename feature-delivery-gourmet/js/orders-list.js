const loadingOverlay  = document.getElementById("loadingOverlay");
const filterDateInput = document.getElementById("filterDate");
const clearFilterBtn  = document.getElementById("clearFilter");
const tableBody       = document.getElementById("ordersTableBody");
const noPedidos       = document.getElementById("noPedidos");

let allPedidos = [];

document.addEventListener("DOMContentLoaded", async () => {
  setTimeout(async () => {
    if (!identifyUser()) {
      const folder   = location.pathname.replace(/[^/]+$/, "");
      const returnTo = location.pathname.split("/").pop();
      window.location.href = `${folder}identify.html?return=${returnTo}`;
      return;
    }

    // botão voltar
    document.getElementById("backBtn")?.addEventListener("click", () => {
      history.length > 1 ? history.back() : null;
    });

    const numero = localStorage.getItem("bgHouse_whatsapp");
    showLoading();

    try {
      const response = await fetch("/api/Usuario/GetPedidosByWhatsAppAsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero })
      });
      if (!response.ok) throw new Error("Falha ao buscar pedidos");

      allPedidos = await response.json();
      hideLoading();

      if (!allPedidos.length) {
        noPedidos.classList.remove("hidden");
        return;
      }
      renderPedidos(allPedidos);
    } catch (err) {
      hideLoading();
      console.error("Erro ao carregar pedidos:", err);
      swal("Erro", "Não foi possível carregar seus pedidos.", "error");
    }
  }, 150);
});

function renderPedidos(pedidos) {
  tableBody.innerHTML = "";
  if (!pedidos.length) {
    noPedidos.classList.remove("hidden");
    return;
  }
  noPedidos.classList.add("hidden");

  pedidos.forEach(p => {
    const data = new Date(p.criadoEm)
                    .toLocaleDateString("pt-BR");
    const fmt = num => {
      const n = (typeof num === "number" ? num : 0);
      return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    };

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data}</td>
      <td class="val total">R$ ${fmt(p.total)}</td>
      <td>
        <a href="order.html?id=${p.pedidoId}" class="pedido-link">
          Ver Pedido
        </a>
      </td>`;
    tableBody.appendChild(tr);
  });
}

// filtrar por data
filterDateInput.addEventListener("change", () => {
  const sel = filterDateInput.value; // "YYYY-MM-DD"
  if (!sel) {
    renderPedidos(allPedidos);
    return;
  }
  const filtered = allPedidos.filter(p => {
    const iso = new Date(p.criadoEm).toISOString().slice(0, 10);
    return iso === sel;
  });
  renderPedidos(filtered);
});

// limpar filtro
clearFilterBtn.addEventListener("click", () => {
  filterDateInput.value = "";
  renderPedidos(allPedidos);
});

function showLoading() {
  loadingOverlay.classList.remove("hidden");
}
function hideLoading() {
  loadingOverlay.classList.add("hidden");
}
