// js/payment.js

function showLoader() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

async function fetchCart(whatsapp) {
  const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
  if (!resp.ok) throw new Error('Erro ao carregar carrinho');
  return resp.json();
}

async function calcularCupom(codigo, usuarioId, lojaId, subtotal) {
  const resp = await fetch('/api/Cupom/CalcularDesconto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
  });
  if (!resp.ok) return 0;
  const data = await resp.json();
  return data.sucesso ? data.dados : 0;
}

function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

document.addEventListener('DOMContentLoaded', async () => {
  showLoader();
  try {
    const backBtn    = document.getElementById('backBtn');
    const subEl      = document.getElementById('subtotal');
    const freteEl    = document.getElementById('frete');
    const descEl     = document.getElementById('desconto');
    const totalEl    = document.getElementById('total');
    const changeSec  = document.getElementById('changeSection');
    const changeInp  = document.getElementById('changeAmount');
    const noChange   = document.getElementById('noChange');
    const finishBtn  = document.getElementById('finishBtn');
    const form       = document.getElementById('paymentForm');

    backBtn.onclick = () => history.back();

    // Usuário
    const whatsapp = localStorage.getItem('bgHouse_whatsapp');
    const userEnc  = localStorage.getItem('bgHouse_id');
    const userId   = userEnc ? parseInt(atob(userEnc)) : null;
    if (!whatsapp || !userId) {
      swal('Ops!', 'Identifique-se primeiro.', 'warning')
        .then(() => window.location.href = 'identify.html?return=payment.html');
      return;
    }

    // Carrinho
    let cart = { items: [] };
    try { cart = await fetchCart(whatsapp); } catch {}
    const subtotal = cart.items.reduce((s,i)=>s + i.precoUnitario*i.quantidade, 0);
    subEl.textContent = formatBRL(subtotal);

    // Frete (Storage ou URL)
    const params = new URLSearchParams(window.location.search);
    let frete = 0;
    if (params.has('frete')) {
      frete = parseFloat(params.get('frete').replace(',', '.')) || 0;
      localStorage.setItem('bgHouse_frete', frete.toFixed(2));
    } else {
      frete = parseFloat(localStorage.getItem('bgHouse_frete') || '0') || 0;
    }
    freteEl.textContent = formatBRL(frete);

    // Cupom
    let desconto = 0;
    const cupom = localStorage.getItem('bgHouse_appliedCoupon');
    if (cupom) {
      const lojaId = parseInt(localStorage.getItem('bgHouse_lojaId'));
      desconto = await calcularCupom(cupom, userId, lojaId, subtotal);
    }
    descEl.textContent = '- ' + formatBRL(desconto);

    // Total
    const total = Math.max(0, subtotal - desconto + frete);
    totalEl.textContent = formatBRL(total);

    // Troco (Dinheiro)
    form.method.forEach(radio => {
      radio.addEventListener('change', () => {
        changeSec.style.display = radio.value === 'Dinheiro' ? 'flex' : 'none';
      });
    });
    if (form.method.value !== 'Dinheiro') {
      changeSec.style.display = 'none';
    }
    noChange.addEventListener('change', () => {
      changeInp.disabled = noChange.checked;
      if (noChange.checked) changeInp.value = '0,00';
    });

    // Finalizar
    finishBtn.onclick = () => {
      const method = form.method.value;
      let troco = 0;
      if (method === 'Dinheiro' && !noChange.checked) {
        troco = parseFloat(changeInp.value.replace(',', '.')) || 0;
        if (troco < total) {
          return swal('Atenção','Troco abaixo do valor da compra.','warning');
        }
      }
      const order = {
        whatsapp, addressId: params.get('addressId')||null,
        paymentMethod: method, changeFor: method==='Dinheiro'?troco:0,
        cartItems: cart.items, subtotal, frete, desconto, total
      };
      console.log('Pedido:', order);
      swal('Sucesso','Pedido finalizado! Confira console.','success');
    };

  } finally {
    hideLoader();
  }
});
