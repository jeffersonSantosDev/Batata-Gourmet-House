document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("loadingOverlay");

  // exibe o overlay
  loading.classList.remove("hidden");

  const params = new URLSearchParams(location.search);
  const pedidoId = parseInt(params.get("id"));

  if (!pedidoId || isNaN(pedidoId)) {
    swal("Ops!", "ID do pedido inválido.", "error")
      .then(() => window.location.href = "orders-list.html");
    return;
  }

  document.getElementById("backBtn").addEventListener("click", () => {
    history.length > 1
      ? history.back()
      : window.location.href = "orders-list.html";
  });

  try {
    const response = await fetch("/api/Usuario/GetDetalhesPedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId })
    });

    if (!response.ok) throw new Error("Pedido não encontrado");
    const pedido = await response.json();

    // timeline original
    const statusEtapas = [
      "Pedido Recebido",
      "Pedido em preparo",
      "Saiu para entrega",
      "Entregue"
    ];
    const indexAtual = statusEtapas.findIndex(etapa =>
      etapa.toLowerCase().trim() === pedido.status.toLowerCase().trim()
    );
    const steps = document.querySelectorAll(".status-timeline .step");
    steps.forEach((step, idx) => {
      if (idx < indexAtual + 1) {
        step.classList.add(idx === indexAtual ? "current" : "completed");
      }
    });

    // preenche dados
    document.getElementById("orderNumber").textContent = pedido.pedidoId;
    const statusPill = document.getElementById("orderStatus");
    statusPill.textContent = pedido.status;
    statusPill.classList.add(
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

    // swal({
    //   title: `Pedido #${pedido.pedidoId}`,
    //   text: `Status: ${pedido.status}`,
    //   icon: "info",
    //   timer: 1500,
    //   buttons: false
    // });

  } catch (err) {
    console.error(err);
    swal("Erro", "Não foi possível carregar os dados do pedido.", "error")
      .then(() => window.location.href = "orders-list.html");
  } finally {
    // oculta o overlay
    loading.classList.add("hidden");
  }
});
