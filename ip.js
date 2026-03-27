(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69",
    IP_API: "https://api.ipify.org?format=json",
    WEBHOOK: "https://discord.com/api/webhooks/1459251137386516584/IdR-wExor-ezEQ88YxRJM-v5NS43WtAqJP-Q6bDv0XnOSYD47bzhh2pxSIW_TIBMcRoR",
    TIMEOUT_MS: 15000
  };

  let isSending = false;
  let currentIP = "Desconocida";

  function escapeHTML(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderBlockedScreen(ip = "Desconocida", reason = "Acceso no autorizado") {
    currentIP = ip;

    document.documentElement.innerHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso Restringido</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Inter',system-ui,sans-serif;min-height:100vh;background:linear-gradient(135deg,#0a0a0f,#12121a);color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;}
          .container{width:100%;max-width:880px;background:#16161f;border-radius:24px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.9);border:1px solid #222;}
          .main{display:flex;flex-direction:column}
          .left{padding:55px 48px;background:#1a1a24;border-bottom:1px solid #222}
          .right{padding:55px 48px}
          h1{font-size:clamp(4rem,10vw,6.5rem);color:#e50914;line-height:1;margin-bottom:12px}
          h2{font-size:1.85rem;margin-bottom:22px}
          p{color:#bbb;margin-bottom:28px}
          .info{background:#21212b;padding:17px 20px;border-radius:12px;margin-bottom:16px;border-left:5px solid #e50914}
          input,textarea{width:100%;padding:16px 20px;background:#21212b;border:1px solid #333;border-radius:12px;color:#fff;font-size:1.05rem;margin-bottom:20px}
          textarea{min-height:140px;resize:vertical}
          input:focus,textarea:focus{border-color:#e50914;box-shadow:0 0 0 4px rgba(229,9,20,0.2);outline:none}
          button{width:100%;background:#e50914;color:white;border:none;padding:18px;font-size:1.12rem;font-weight:700;border-radius:12px;cursor:pointer;transition:all .3s}
          button:hover:not(:disabled){background:#f22;transform:translateY(-3px)}
          button:disabled{background:#555;cursor:not-allowed}
          #status{margin-top:20px;font-size:1.05rem;text-align:center;min-height:1.6em}
          @media(min-width:768px){.main{flex-direction:row}.left{border-bottom:none;border-right:1px solid #222;flex:1.4}.right{flex:1}}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="main">
            <div class="left">
              <h1>403</h1>
              <h2>Acceso Restringido</h2>
              <p>No estás autorizado para ver este contenido.</p>
              <div class="info"><strong>Tu IP:</strong> ${escapeHTML(ip)}</div>
              <div class="info"><strong>Motivo:</strong> ${escapeHTML(reason)}</div>
            </div>
            <div class="right">
              <h2>Solicitar acceso</h2>
              <input id="name" type="text" placeholder="Tu nombre o usuario" maxlength="80">
              <textarea id="reason" placeholder="Explica brevemente por qué necesitas acceso..."></textarea>
              <button id="sendBtn">Enviar solicitud</button>
              <div id="status"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    document.getElementById("sendBtn").addEventListener("click", sendAccessRequest);
  }

  async function sendAccessRequest() {
    if (isSending) return;
    isSending = true;

    const btn = document.getElementById("sendBtn");
    const statusEl = document.getElementById("status");

    const name = (document.getElementById("name").value.trim() || "Anónimo").slice(0, 80);
    const reason = (document.getElementById("reason").value.trim() || "Sin motivo").slice(0, 1400);

    btn.disabled = true;
    statusEl.style.color = "#aaa";
    statusEl.textContent = "Enviando...";

    console.log("Enviando payload con IP:", currentIP);

    try {
      const payload = {
        username: "Solicitud de Acceso",
        content: `**Nueva solicitud de acceso**\n\n**Nombre:** ${name}\n**IP:** ${currentIP}\n**Motivo:** ${reason}\n\nDesde: ${location.hostname}`
      };

      await fetch(CONFIG.WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors",
        cache: "no-store"
      });

      statusEl.style.color = "#4ade80";
      statusEl.innerHTML = "✅ Solicitud enviada (puede tardar unos segundos en llegar a Discord)";
      btn.textContent = "✓ Enviado";

      console.log("Petición enviada (esperamos que Discord la acepte)");
    } catch (err) {
      console.error("Error fetch:", err);
      statusEl.style.color = "#f87171";
      statusEl.textContent = "❌ Error al enviar. Revisa consola.";
    } finally {
      isSending = false;
    }
  }

  async function checkAccess() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

      const res = await fetch(CONFIG.IP_API, { signal: controller.signal, cache: "no-store" });
      clearTimeout(timeout);

      const data = await res.json();
      currentIP = data.ip || data.query || "Desconocida";

      if (currentIP !== CONFIG.ALLOWED_IP) {
        renderBlockedScreen(currentIP, "IP no permitida");
      }
    } catch (err) {
      console.warn("Error IP:", err);
      renderBlockedScreen("Desconocida", "Error al verificar IP");
    }
  }

  checkAccess();

})();