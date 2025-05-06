document.addEventListener("DOMContentLoaded", async () => {
  const progressContainer = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");

  // 1) Inicia a barra
  progressFill.style.width = "0%";
  progressContainer.style.display = "block";

  const params = new URLSearchParams(location.search);
  const pedidoId = parseInt(params.get("id"));

  if (!pedidoId || isNaN(pedidoId)) {
    progressFill.style.width = "100%";               // completa antes de sair
    await new Promise(r => setTimeout(r, 200));      // dá tempo da animação
    window.location.href = "orders-list.html";
    return;
  }

  const backBtn = document.getElementById("backBtn");
  backBtn.addEventListener("click", () => {
    history.length > 1 ? history.back() : window.location.href = "orders-list.html";
  });

  try {
    // 2) Antes do fetch, indica início
    progressFill.style.width = "20%";

    const response = await fetch("/api/Usuario/GetDetalhesPedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId })
    });

    if (!response.ok) throw new Error("Pedido não encontrado");

    // 3) Após receber resposta, meio caminho andado
    progressFill.style.width = "60%";

    const pedido = await response.json();

    // montagem dos passos (progress-step)
    const statusEtapas = [
      "Pedido Recebido",
      "Pedido em preparo",
      "Saiu para entrega",
      "Entregue"
    ];
    const indexAtual = statusEtapas.findIndex(etapa =>
      etapa.toLowerCase().trim() === pedido.status.toLowerCase().trim()
    );
    const steps = document.querySelectorAll(".progress-step");
    steps.forEach((step, i) => {
      if (i <= indexAtual) step.classList.add("completed");
    });
    const percentage = (indexAtual / (steps.length - 1)) * 100;
    progressFill.style.width = `${percentage}%`;

    // preenche o restante dos campos
    document.getElementById("orderNumber").textContent = pedido.pedidoId;
    document.getElementById("orderStatus").textContent = pedido.status;
    document.getElementById("orderStatus").classList.add(
      pedido.status === "Pedido em preparo" ? "preparando" : "received"
    );
    document.getElementById("orderDate").textContent =
      new Date(pedido.criadoEm).toLocaleDateString("pt-BR");
    document.getElementById("orderStep").textContent = pedido.status;

    const body = document.getElementById("itemsList");
    body.innerHTML = "";
    pedido.itens.forEach(item => {
      const adicionais = item.adicionais?.map(a =>
        `<div class="adicional">+ ${a.nome} (${a.quantidade}× - R$ ${a.preco.toFixed(2)})</div>`
      ).join("") || "";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.quantidade}× ${item.produtoNome}${adicionais}</td>
        <td>R$ ${(item.precoUnitario * item.quantidade).toFixed(2)}</td>`;
      body.appendChild(tr);
    });

    document.getElementById("subtotal").textContent = `+ R$ ${pedido.subtotal.toFixed(2)}`;
    document.getElementById("deliveryFee").textContent = `+ R$ ${pedido.frete.toFixed(2)}`;
    document.getElementById("total").textContent = `R$ ${pedido.total.toFixed(2)}`;
    document.getElementById("deliveryAddress").textContent = pedido.enderecoEntrega;
    document.getElementById("paymentMethod").textContent = pedido.formaPagamento;

    swal({
      title: `Pedido #${pedido.pedidoId}`,
      text: `Status: ${pedido.status}`,
      icon: "info",
      timer: 1500,
      buttons: false
    });

    // 4) Conclui a barra
    progressFill.style.width = "100%";
    // opcional: esconde depois de completar
    setTimeout(() => { progressContainer.style.display = "none"; }, 500);

  } catch (err) {
    console.error(err);
    progressFill.style.width = "100%"; 
    setTimeout(() => { progressContainer.style.display = "none"; }, 500);
    swal("Erro", "Não foi possível carregar os dados do pedido.", "error")
      .then(() => window.location.href = "orders-list.html");
  }
});
