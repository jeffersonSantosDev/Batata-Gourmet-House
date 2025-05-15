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
    headers:{ 'Content-Type':'application/json' },
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
    // --- Elementos da tela ---
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
    const radios        = form.elements['method'];    // RadioNodeList
    const changeSec     = document.getElementById('changeSection');
    const changeInp     = document.getElementById('changeAmount');
    const noChangeChk   = document.getElementById('noChange');
    const finishBtn     = document.getElementById('finishBtn');

    backBtn.onclick = () => history.back();

    // --- 1) Dados de entrega ---
    const rawAddress = localStorage.getItem('bgHouse_selectedAddress');
    const rawFrete   = localStorage.getItem('bgHouse_frete');

    let storedFrete = 0;
    if (rawFrete) {
      storedFrete = parseFloat(rawFrete);
      if (storedFrete > 0) {
        freteEl.textContent = fmtBRL(storedFrete);
        fretLine.style.display = '';
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

    // --- 2) Carrinho & Subtotal (incluindo adicionais) ---
    const whatsapp = localStorage.getItem('bgHouse_whatsapp');
    let cart = { items: [] }, subtotal = 0;
    try {
      cart = await fetchCart(whatsapp);
      subtotal = cart.items.reduce((sum, item) => {
        const base   = item.precoUnitario * item.quantidade;
        const addons = (item.adicionais || []).reduce(
          (s, ad) => s + ad.preco * ad.quantidade,
          0
        );
        return sum + base + addons;
      }, 0);
    } catch {
      // se der erro, subtotal permanece 0
    }
    subEl.textContent = fmtBRL(subtotal);

    // --- 3) Cupom ---
    let desconto = 0;
    const cupomCode = localStorage.getItem('bgHouse_appliedCoupon');
    const userId    = parseInt(atob(localStorage.getItem('bgHouse_id')));
    const storeId   = parseInt(localStorage.getItem('bgHouse_lojaId'));

    if (cupomCode) {
      desconto = await calcularCupom(cupomCode, userId, storeId, subtotal);
    }
    // mostramos sempre a linha, mesmo com zero
    descEl.textContent = '- ' + fmtBRL(desconto);
    cupLine.style.display = '';

    // --- 4) Total geral ---
    const total = Math.max(0, subtotal - desconto + storedFrete);
    totalEl.textContent = fmtBRL(total);

    // --- 5) Controle de Troco ---
    // exibe o campo "troco" apenas quando "Dinheiro" estiver marcado
    Array.from(radios).forEach(radio => {
      radio.addEventListener('change', () => {
        changeSec.style.display = radio.value === 'Dinheiro' ? 'flex' : 'none';
        // limpa valor de troco ao alternar
        if (radio.value !== 'Dinheiro') {
          noChangeChk.checked = false;
          changeInp.disabled  = true;
          changeInp.value     = '';
        }
      });
    });
    // estado inicial
    if (form.elements['method'].value !== 'Dinheiro') {
      changeSec.style.display = 'none';
      changeInp.disabled      = true;
    }

    noChangeChk.addEventListener('change', () => {
      if (noChangeChk.checked) {
        changeInp.value    = '';
        changeInp.disabled = true;
      } else {
        changeInp.disabled = false;
        changeInp.focus();
      }
    });

    // só permitir números e vírgula
    changeInp.addEventListener('input', e => {
      e.target.value = e.target.value
        .replace(/[^\d,]/g, '')         // remove tudo que não for dígito ou vírgula
        .replace(/,(\d{2}).+/, ',$1');  // até duas casas decimais
    });

    // --- 6) Finalizar pedido ---
    finishBtn.addEventListener('click', () => {
      const method = form.elements['method'].value;
      let changeFor = 0;
      if (method === 'Dinheiro' && !noChangeChk.checked) {
        changeFor = parseFloat(
          changeInp.value.replace(',', '.')
        ) || 0;
        if (changeFor < total) {
          swal('Atenção', 'Troco abaixo do valor da compra.', 'warning');
          return;
        }
      }

      const order = {
        whatsapp,
        addressId: rawAddress ? JSON.parse(rawAddress).id : null,
        paymentMethod: method,
        changeFor,
        lojaId:   storeId,
        usuarioId,
        cartItems: cart.items,
        subtotal,
        frete:    storedFrete,
        desconto,
        total
      };
      console.log('Pedido:', order);
      swal('Sucesso', 'Pedido finalizado! Veja o console.', 'success');
    });

  } finally {
    hideLoader();
  }
});
