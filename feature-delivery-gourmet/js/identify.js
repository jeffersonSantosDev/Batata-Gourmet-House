// js/identify.js

/**
 * Checa se já existe WhatsApp+Nome válidos no localStorage.
 * @returns {boolean} true se identificado; false se não.
 */
function identifyUser() {
  const nome  = localStorage.getItem("bgHouse_name");
  const whats = localStorage.getItem("bgHouse_whatsapp");
  const id    = localStorage.getItem("bgHouse_id");

  return !!(nome && whats && id);
}

window.identifyUser = identifyUser;
