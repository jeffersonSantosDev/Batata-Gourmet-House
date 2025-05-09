document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("loadingOverlay");
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
    const res = await fetch("/api/Usuario/GetDetalhesPedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId })
    });
    if (!res.ok) throw new Error("Pedido não encontrado");
    const pedido = await res.json();

    // timeline
    const statusEtapas = [
      "Pedido Recebido",
      "Pedido em preparo",
      "Saiu para entrega",
      "Entregue"
    ];
    const idxAtual = statusEtapas.findIndex(
      e => e.toLowerCase().trim() === pedido.status.toLowerCase().trim()
    );
    document.querySelectorAll(".status-timeline .step")
      .forEach((step, i) => {
        if (i < idxAtual + 1) {
          step.classList.add(i === idxAtual ? "current" : "completed");
        }
      });

    // cabeçalho
    document.getElementById("orderNumber").textContent = pedido.pedidoId;
    const statusPill = document.getElementById("orderStatus");
    statusPill.textContent = pedido.status;
    statusPill.classList.add(
      pedido.status === "Pedido em preparo" ? "preparando" : "received"
    );
    document.getElementById("orderDate").textContent =
      new Date(pedido.criadoEm).toLocaleDateString("pt-BR");
    document.getElementById("orderStep").textContent = pedido.status;

    // items e cálculo de subtotal incluindo adicionais
    const body = document.getElementById("itemsList");
    body.innerHTML = "";

    let subtotalCalculado = 0;
    pedido.itens.forEach(item => {
      // soma dos adicionais
      const adicionalTotal = (item.adicionais || []).reduce((acc, a) =>
        acc + (a.preco * a.quantidade), 0
      );

      // total linha: base + adicionais
      const baseTotal = item.precoUnitario * item.quantidade;
      const linhaTotal = baseTotal + adicionalTotal;
      subtotalCalculado += linhaTotal;

      // marcações HTML dos adicionais
      const adicionaisHTML = (item.adicionais || []).map(a =>
        `<div class="adicional">+ ${a.nome} (${a.quantidade}× - R$ ${a.preco.toFixed(2)})</div>`
      ).join("");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.quantidade}× ${item.produtoNome}${adicionaisHTML}</td>
        <td>R$ ${linhaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      `;
      body.appendChild(tr);
    });

    // exibe subtotal recalculado e atualiza total
    document.getElementById("subtotal").textContent =
      `+ R$ ${subtotalCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("deliveryFee").textContent =
      `+ R$ ${pedido.frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const total = subtotalCalculado + pedido.frete;
    document.getElementById("total").textContent =
      `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    // endereço e pagamento
    document.getElementById("deliveryAddress").textContent = pedido.enderecoEntrega;
    document.getElementById("paymentMethod").textContent = pedido.formaPagamento;

  } catch (err) {
    console.error(err);
    swal("Erro", "Não foi possível carregar os dados do pedido.", "error")
      .then(() => window.location.href = "orders-list.html");
  } finally {
    loading.classList.add("hidden");
  }
});
