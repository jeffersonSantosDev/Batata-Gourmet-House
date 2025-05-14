 // js/payment.js

function showLoader() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

async function fetchCart(whatsapp) {
  const r = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
  if (!r.ok) throw new Error();
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
    const backBtn     = document.getElementById('backBtn');
    const delivCard   = document.getElementById('deliveryCard');
    const delivName   = document.getElementById('delivName');
    const delivPhone  = document.getElementById('delivPhone');
    const delivAddr   = document.getElementById('delivAddress');
    const subEl       = document.getElementById('subtotal');
    const cupLine     = document.getElementById('cupomLine');
    const descEl      = document.getElementById('desconto');
    const fretLine    = document.getElementById('freteLine');
    const freteEl     = document.getElementById('frete');
    const totalEl     = document.getElementById('total');
    const form        = document.getElementById('paymentForm');
    const changeSec   = document.getElementById('changeSection');
    const changeInp   = document.getElementById('changeAmount');
    const noChangeChk = document.getElementById('noChange');
    const finishBtn   = document.getElementById('finishBtn');

    backBtn.onclick = () => history.back();

    // 1) Carrega usuário e entrega
    const whatsapp = localStorage.getItem('bgHouse_whatsapp');
    const addrJSON = localStorage.getItem('bgHouse_selectedAddress');
    if (addrJSON) {
      const addr = JSON.parse(addrJSON);
      delivName.textContent   = localStorage.getItem('bgHouse_name') || 'Você';
      delivPhone.textContent  = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/,'+$1 $2-$3');
      delivAddr.textContent   = `${addr.rua}, ${addr.numero} (${addr.referencia||'sem ref.'})`;
      delivCard.style.display = '';
    }

    // 2) Carrinho e subtotal
    let cart = { items: [] }, subtotal = 0;
    try { cart = await fetchCart(whatsapp); }
    catch {}
    subtotal = cart.items.reduce((s,i)=>s + i.precoUnitario*i.quantidade,0);
    subEl.textContent = fmtBRL(subtotal);

    // 3) Frete
    const storedFrete = parseFloat(localStorage.getItem('bgHouse_frete')||'0');
    if (storedFrete > 0) {
      freteEl.textContent = fmtBRL(storedFrete);
    } else {
      fretLine.style.display = 'none';
    }

    // 4) Cupom
    const cupomCode = localStorage.getItem('bgHouse_appliedCoupon');
    let desconto = 0;
    if (cupomCode) {
      const userId  = parseInt(atob(localStorage.getItem('bgHouse_id')));
      const storeId = parseInt(localStorage.getItem('bgHouse_lojaId'));
      desconto = await calcularCupom(cupomCode, userId, storeId, subtotal);
    }
    if (desconto > 0) {
      descEl.textContent = '- ' + fmtBRL(desconto);
    } else {
      cupLine.style.display = 'none';
    }

    // 5) Total
    const total = Math.max(0, subtotal - desconto + (storedFrete||0));
    totalEl.textContent = fmtBRL(total);

    // 6) Troco (Dinheiro)
    Array.from(form.method).forEach(r => r.addEventListener('change', _=> {
      changeSec.style.display = r.value === 'Dinheiro' ? 'flex' : 'none';
    }));
    if (form.method.value !== 'Dinheiro') changeSec.style.display = 'none';
    noChangeChk.addEventListener('change', _=> {
      changeInp.disabled = noChangeChk.checked;
      if (noChangeChk.checked) changeInp.value = '0,00';
    });

    // 7) Finalizar
    finishBtn.onclick = () => {
      const method = form.method.value;
      let troco = 0;
      if (method==='Dinheiro' && !noChangeChk.checked) {
        troco = parseFloat(changeInp.value.replace(',','.'))||0;
        if (troco < total)
          return swal('Atenção','Troco abaixo do valor da compra.','warning');
      }
      const order = {
        whatsapp,
        addressId: addrJSON ? JSON.parse(addrJSON).id : null,
        paymentMethod: method,
        changeFor: method==='Dinheiro'?troco:0,
        cartItems: cart.items,
        subtotal,
        frete: storedFrete||0,
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
