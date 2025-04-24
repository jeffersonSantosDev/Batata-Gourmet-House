// js/order.js
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(location.search);
    const id     = params.get("id");
    const orders = JSON.parse(localStorage.getItem("bgHouse_orders") || "[]");
    let order    = orders.find(o => String(o.id) === id) || orders[0] || {};
  
    // Garantir defaults
    order.status       = order.status || "Pedido Recebido";
    order.step         = order.step   || "Pedido Recebido";
    order.date         = order.date   || "—";
    order.items        = order.items  || [
      { quantity: 1, name: "Batata Calabresa", price: "R$ 12,00" },
      { quantity: 1, name: "Batata Bacon",     price: "R$ 15,00" }
    ];
    order.subtotal     = order.subtotal  || "R$ 27,00";
    order.delivery     = order.delivery  || "R$ 5,00";
    order.total        = order.total     || "R$ 32,00";
    order.address      = order.address   || "Av. Paulista, 1000";
    order.paymentMethod= order.paymentMethod || "Cartão de Crédito";
  
    // Se não encontrou nenhum pedido, aborta
    if (!order.id) {
      swal("Ops!", "Pedido não encontrado.", "error")
        .then(() => window.location.href = "/");
      return;
    }
  
    // Botão voltar
    document.getElementById("backBtn").onclick = () =>
      history.length > 1 ? history.back() : window.location.href = "/";
  
    // Timeline (fake)
    const steps = [
      "Pedido Recebido",
      "Pedido em preparo",
      "Saiu para entrega",
      "Entregue"
    ];
    const curIndex = steps.indexOf(order.step);
    const tlEl = document.getElementById("statusTimeline");
    tlEl.innerHTML = steps.map((lbl, i) => {
      let cls = "";
      if (i < curIndex) cls = "completed";
      else if (i === curIndex) cls = "current";
      return `
        <div class="step ${cls}">
          <span class="circle"></span>
          <span class="step-label">${lbl.replace("Pedido ","")}</span>
        </div>
      `;
    }).join("");
  
    // Cabeçalho do pedido
    document.getElementById("orderNumber").textContent = order.id;
    const statusEl = document.getElementById("orderStatus");
    statusEl.textContent = order.status;
    statusEl.classList.add(
      order.step === "Pedido em preparo" ? "preparando" : "received"
    );
    document.getElementById("orderDate").textContent = order.date;
    document.getElementById("orderStep").textContent = order.step;
  
    // Itens
    const body = document.getElementById("itemsList");
    body.innerHTML = order.items.map(item => `
      <tr>
        <td>${item.quantity}× ${item.name}</td>
        <td>${item.price}</td>
      </tr>
    `).join("");
  
    // Resumo
    document.getElementById("subtotal").textContent    = `+ ${order.subtotal}`;
    document.getElementById("deliveryFee").textContent = `+ ${order.delivery}`;
    document.getElementById("total").textContent       = order.total;
  
    // Entrega e pagamento
    document.getElementById("deliveryAddress").textContent = order.address;
    document.getElementById("paymentMethod").textContent   = order.paymentMethod;
  
    // Pop-up inicial com status corretamente definido
    swal({
      title: `Pedido #${order.id}`,
      text:  `Status: ${order.status}`,
      icon:  "info",
      timer: 1500,
      buttons: false
    });
  });
  