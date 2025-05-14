// js/payment.js

function showLoader() {
    document.getElementById("loadingOverlay").classList.remove("hidden");
  }
  function hideLoader() {
    document.getElementById("loadingOverlay").classList.add("hidden");
  }
  
  async function fetchCart(whatsapp) {
    showLoader();
    try {
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      if (!resp.ok) throw new Error();
      return resp.json();
    } finally {
      hideLoader();
    }
  }
  
  async function fetchDeliveryParams() {
    // pepare: puxar valor de frete e endereçoId da query string (ex: ?addressId=5)
    const params = new URLSearchParams(window.location.search);
    return {
      addressId: params.get("addressId") ? parseInt(params.get("addressId")) : null,
      frete: parseFloat(localStorage.getItem("bgHouse_frete") || "0")
    };
  }
  
  document.addEventListener("DOMContentLoaded", async () => {
    const backBtn      = document.getElementById("backBtn");
    const subtotalEl   = document.getElementById("subtotal");
    const freteEl      = document.getElementById("frete");
    const descontoEl   = document.getElementById("desconto");
    const totalEl      = document.getElementById("total");
    const changeSec    = document.getElementById("changeSection");
    const changeInput  = document.getElementById("changeAmount");
    const noChangeChk  = document.getElementById("noChange");
    const finishBtn    = document.getElementById("finishBtn");
    const form         = document.getElementById("paymentForm");
    const fmt          = v => v.toFixed(2).replace(".",",");
  
    backBtn.onclick = () => history.back();
  
    // 1) Carrega carrinho
    const whatsapp = localStorage.getItem("bgHouse_whatsapp");
    const cart = await fetchCart(whatsapp);
    const subtotal = cart.items.reduce((s,i)=> s + i.precoUnitario*i.quantidade, 0);
    subtotalEl.textContent = `R$ ${fmt(subtotal)}`;
  
    // 2) Frete e endereço
    const params = await fetchDeliveryParams();
    const frete = params.frete || 0;
    freteEl.textContent = `R$ ${fmt(frete)}`;
  
    // 3) Cupom
    const cupomCode = localStorage.getItem("bgHouse_appliedCoupon");
    let desconto = 0;
    if (cupomCode) {
      // já foi aplicado no resumo; recupera valor
      desconto = parseFloat(localStorage.getItem("bgHouse_desconto") || "0");
    }
    descontoEl.textContent = `R$ ${fmt(desconto)}`;
  
    // 4) Total
    const total = subtotal - desconto + frete;
    totalEl.textContent = `R$ ${fmt(total)}`;
  
    // 5) Troco: só em Dinheiro
    form.method.forEach(radio => {
      radio.addEventListener("change", () => {
        if (radio.value === "Dinheiro") {
          changeSec.style.display = "flex";
        } else {
          changeSec.style.display = "none";
        }
      });
    });
    // inicial
    if (form.method.value !== "Dinheiro") {
      changeSec.style.display = "none";
    }
  
    // 6) Checkbox "não preciso de troco"
    noChangeChk.addEventListener("change", () => {
      changeInput.disabled = noChangeChk.checked;
      if (noChangeChk.checked) changeInput.value = "0.00";
    });
  
    // 7) Finalizar Pedido
    finishBtn.onclick = () => {
      const method = form.method.value;
      let changeFor = 0;
      if (method === "Dinheiro" && !noChangeChk.checked) {
        changeFor = parseFloat(changeInput.value) || 0;
        if (changeFor < total) {
          return swal("Atenção","Troco abaixo do valor da compra.","warning");
        }
      }
  
      const order = {
        whatsapp,
        addressId: params.addressId,
        paymentMethod: method,
        changeFor: method==="Dinheiro" ? changeFor : 0,
        cartItems: cart.items,
        subtotal,
        frete,
        desconto,
        total
      };
  
      console.log("Order to submit:", order);
      swal("Sucesso","Pedido finalizado! Veja console para detalhes.","success");
      // Aqui você enviaria via fetch para seu endpoint de criação de pedido...
    };
  });
  