// js/payment.js

function showLoader() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

async function fetchCart(whatsapp) {
  const r = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
  if (!r.ok) throw new Error('Erro ao carregar carrinho');
  return r.json();
}

async function calcularCupom(code, userId, storeId, sub) {
  const r = await fetch('/api/Cupom/CalcularDesconto', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ codigo: code, usuarioId: userId, lojaId: storeId, valorOriginal: sub })
  });
  if (!r.ok) return 0;
  const j = await r.json();
  return j.sucesso ? j.dados : 0;
}

function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

document.addEventListener('DOMContentLoaded', async () => {
  showLoader();
  try {
    // --- Elementos da Tela ---
    const backBtn       = document.getElementById('backBtn');
    const deliverySec   = document.getElementById('deliverySection');
    const delivName     = document.getElementById('delivName');
    const delivPhone    = document.getElementById('delivPhone');
    const delivAddress  = document.getElementById('delivAddress');

    const subEl         = document.getElementById('subtotal');
    const cupLine       = document.getElementById('cupomLine');
    const descEl        = document.getElementById('desconto');
    const fretLine      = document.getElementById('freteLine');
    const freteEl       = document.getElementById('frete');
    const totalEl       = document.getElementById('total');

    const form          = document.getElementById('paymentForm');
    const changeSec     = document.getElementById('changeSection');
    const changeInp     = document.getElementById('changeAmount');
    const noChangeChk   = document.getElementById('noChange');
    const finishBtn     = document.getElementById('finishBtn');

    backBtn.onclick = () => history.back();

    // --- 1) Dados de Entrega ---
    const rawAddress = localStorage.getItem('bgHouse_selectedAddress');
    const rawFrete   = localStorage.getItem('bgHouse_frete');

    let storedFrete = 0;
    if (rawFrete) {
      storedFrete = parseFloat(rawFrete);
      if (storedFrete > 0) {
        freteEl.textContent = fmtBRL(storedFrete);
        fretLine.style.display = '';  // mostra linha de frete
      }
    }

    if (rawAddress) {
      try {
        const addr = JSON.parse(rawAddress);
        delivName.textContent    = localStorage.getItem('bgHouse_name') || 'Você';
        delivPhone.textContent   = localStorage.getItem('bgHouse_whatsapp')
                                     .replace(/(\d{2})(\d{5})(\d{4})/,'+$1 $2-$3');
        delivAddress.textContent = `${addr.rua}, ${addr.numero}` +
                                    (addr.referencia ? ` (${addr.referencia})` : '');
        deliverySec.style.display = '';
      } catch {
        localStorage.removeItem('bgHouse_selectedAddress');
      }
    }

    // --- 2) Carrinho & Subtotal ---
    const whatsapp = localStorage.getItem('bgHouse_whatsapp');
    let cart = { items: [] }, subtotal = 0;
    try {
      cart = await fetchCart(whatsapp);
      subtotal = cart.items.reduce((s,i) => s + i.precoUnitario * i.quantidade, 0);
    } catch {
      // keep subtotal = 0
    }
    subEl.textContent = fmtBRL(subtotal);

    // --- 3) Cupom ---
    let desconto = 0;
    const cupomCode = localStorage.getItem('bgHouse_appliedCoupon');
    if (cupomCode) {
      const userId  = parseInt(atob(localStorage.getItem('bgHouse_id')));
      const storeId = parseInt(localStorage.getItem('bgHouse_lojaId'));
      desconto = await calcularCupom(cupomCode, userId, storeId, subtotal);
    }
    // sempre exibe a linha do cupom; só esconde quando valor é zero
    if (desconto > 0) {
      descEl.textContent = '- ' + fmtBRL(desconto);
      cupLine.style.display = '';
    } else {
      descEl.textContent = '- ' + fmtBRL(0);
      cupLine.style.display = ''; 
    }

    // --- 4) Total geral ---
    const total = Math.max(0, subtotal - desconto + storedFrete);
    totalEl.textContent = fmtBRL(total);

    // --- 5) Controle de Troco ---
    Array.from(form.method).forEach(radio => {
      radio.addEventListener('change', () => {
        changeSec.style.display = radio.value === 'Dinheiro' ? 'flex' : 'none';
      });
    });
    if (form.method.value !== 'Dinheiro') {
      changeSec.style.display = 'none';
    }
    noChangeChk.addEventListener('change', () => {
      changeInp.disabled = noChangeChk.checked;
      if (noChangeChk.checked) changeInp.value = '0,00';
    });

    // --- 6) Finalizar Pedido ---
    finishBtn.onclick = () => {
      const method = form.method.value;
      let changeFor = 0;
      if (method === 'Dinheiro' && !noChangeChk.checked) {
        changeFor = parseFloat(changeInp.value.replace(',','.')) || 0;
        if (changeFor < total) {
          return swal('Atenção','Troco abaixo do valor da compra.','warning');
        }
      }
      const order = {
        whatsapp,
        addressId: rawAddress ? JSON.parse(rawAddress).id : null,
        paymentMethod: method,
        changeFor,
        cartItems: cart.items,
        subtotal,
        frete: storedFrete,
        desconto,
        total
      };
      console.log('Pedido:', order);
      swal('Sucesso','Pedido finalizado! Veja o console.','success');
    };
  } finally {
    hideLoader();
  }
});
