// js/identify.js

/**
 * Checa se já existe WhatsApp+Nome válidos no localStorage.
 * @returns {boolean} true se já identificado; 
 *                    false e redireciona para identify.html caso contrário.
 */
function identifyUser() {
  const w = localStorage.getItem("bgHouse_whatsapp") || "";
  const n = localStorage.getItem("bgHouse_name")     || "";
  const digits = w.replace(/\D/g, "");
  const validW = digits.length === 10 || digits.length === 11;
  const validN = n.trim().length >= 3;

  if (validW && validN) {
    return true;
  }

  // não identificado → redireciona para a página de cadastro
  const retorno = encodeURIComponent(window.location.pathname);
  window.location.href = `identify.html?return=${retorno}`;
  return false;
}

// expõe globalmente
window.identifyUser = identifyUser;
