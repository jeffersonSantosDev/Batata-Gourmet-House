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

async function calcularCupomNoPagamento(codigo, usuarioId, lojaId, subtotal) {
  const resp = await fetch('/api/Cupom/CalcularDesconto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ codigo, usuarioId, lojaId, valorOriginal: subtotal })
  });
  if (!resp.ok) return 0;
  const data = await resp.json();
  return data.sucesso ? data.dados : 0;
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

document.addEventListener('DOMContentLoaded', async () => {
  showLoader();

  try {
    const backBtn     = document.getElementById('backBtn');
    const subtotalEl  = document.getElementById('subtotal');
    const freteEl     = document.getElementById('frete');
    const descontoEl  = document.getElementById('desconto');
    const totalEl     = document.getElementById('total');
    const changeSec   = document.getElementById('changeSection');
    const changeInput = document.getElementById('changeAmount');
    const noChangeChk = document.getElementById('noChange');
    const finishBtn   = document.getElementById('finishBtn');
    const form        = document.getElementById('paymentForm');
    const fmt         = v => v.toFixed(2).replace('.',',');

    backBtn.onclick = () => history.back();

    // 1) Carrega credenciais do usuário
    const whatsapp = localStorage.getItem('bgHouse_whatsapp');
    const usuarioIdEnc = localStorage.getItem('bgHouse_id');
    const usuarioId = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;
    if (!whatsapp || !usuarioId) {
      swal('Ops!', 'Identifique-se primeiro.', 'warning')
        .then(() => window.location.href = 'identify.html?return=payment.html');
      return;
    }

    // 2) Busca carrinho e calcula subtotal
    let cart = { items: [] };
    try {
      cart = await fetchCart(whatsapp);
    } catch {
      console.error('Falha ao buscar carrinho');
    }
    const subtotal = cart.items.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0);
    subtotalEl.textContent = formatBRL(subtotal);

    // 3) Carrega frete de localStorage ou URL
    const params = new URLSearchParams(window.location.search);
    let frete = 0;
    if (params.has('frete')) {
      frete = parseFloat(params.get('frete').replace(',', '.')) || 0;
      localStorage.setItem('bgHouse_frete', frete.toFixed(2));
    } else {
      frete = parseFloat(localStorage.getItem('bgHouse_frete') || '0') || 0;
    }
    freteEl.textContent = formatBRL(frete);

    // 4) Aplica cupom salvo
    let desconto = 0;
    const cupomCode = localStorage.getItem('bgHouse_appliedCoupon');
    if (cupomCode) {
      desconto = await calcularCupomNoPagamento(
        cupomCode,
        parseInt(atob(localStorage.getItem('bgHouse_id'))),
        parseInt(localStorage.getItem('bgHouse_lojaId')),
        subtotal
      );
    }
    descontoEl.textContent = '- ' + formatBRL(desconto);

    // 5) Calcula total
    const total = Math.max(0, subtotal - desconto + frete);
    totalEl.textContent = formatBRL(total);

    // 6) Controle de troco (Dinheiro)
    form.method.forEach(radio => {
      radio.addEventListener('change', () => {
        changeSec.style.display = radio.value === 'Dinheiro' ? 'flex' : 'none';
      });
    });
    if (form.method.value !== 'Dinheiro') {
      changeSec.style.display = 'none';
    }

    noChangeChk.addEventListener('change', () => {
      changeInput.disabled = noChangeChk.checked;
      if (noChangeChk.checked) changeInput.value = '0.00';
    });

    // 7) Finalizar pedido
    finishBtn.onclick = () => {
      const method = form.method.value;
      let changeFor = 0;

      if (method === 'Dinheiro' && !noChangeChk.checked) {
        changeFor = parseFloat(changeInput.value.replace(',', '.')) || 0;
        if (changeFor < total) {
          return swal('Atenção', 'Troco abaixo do valor da compra.', 'warning');
        }
      }

      const order = {
        whatsapp,
        addressId: params.get('addressId')
          ? parseInt(params.get('addressId'))
          : null,
        paymentMethod: method,
        changeFor: method === 'Dinheiro' ? changeFor : 0,
        cartItems: cart.items,
        subtotal,
        frete,
        desconto,
        total
      };

      console.log('Order to submit:', order);
      swal('Sucesso', 'Pedido finalizado! Veja o console para detalhes.', 'success');
    };
  } finally {
    hideLoader();
  }
});
