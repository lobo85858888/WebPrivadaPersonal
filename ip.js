(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69",
    // Mejores alternativas a ipify (elige una):
    IP_API: "https://api.ipify.org?format=json",        // actual
    // Otras buenas opciones: 
    // "https://api.ipapi.is/json" 
    // "https://ipinfo.io/json" (requiere token gratuito para más uso)
    WEBHOOK: "https://discord.com/api/webhooks/...",
    TIMEOUT_MS: 4000
  };

  const state = { sending: false };

  function escapeHTML(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Función para renderizar la pantalla bloqueada (separada para mayor claridad)
  function renderBlockedScreen(ip = "Desconocida", reason = "Acceso no autorizado") {
    document.documentElement.innerHTML = `
      <head>
        <meta charset="UTF-8">
        <title>Acceso Restringido</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0a0a0f;
            color: #fff;
            padding: 20px;
          }
          .container {
            display: flex;
            max-width: 820px;
            width: 100%;
            background: #141417;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            border: 1px solid #222;
          }
          .left, .right { padding: 48px; }
          .left { flex: 1.3; border-right: 1px solid #222; }
          .right { flex: 1; }
          h1 { font-size: 4.5rem; color: #e50914; line-height: 1; margin-bottom: 8px; }
          h2 { font-size: 1.65rem; margin-bottom: 24px; font-weight: 600; }
          p { color: #aaa; line-height: 1.6; margin-bottom: 24px; }
          .info div {
            background: #1f1f24;
            padding: 14px 16px;
            border-radius: 10px;
            margin-bottom: 12px;
            font-size: 0.95rem;
          }
          input, textarea {
            width: 100%;
            padding: 14px 16px;
            margin-bottom: 16px;
            background: #1f1f24;
            border: none;
            border-radius: 10px;
            color: #fff;
            font-size: 1rem;
          }
          textarea { resize: vertical; min-height: 110px; }
          button {
            width: 100%;
            background: #e50914;
            color: white;
            border: none;
            padding: 14px;
            font-size: 1.05rem;
            font-weight: 700;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover { background: #f22; }
          button:disabled { background: #666; cursor: not-allowed; }
          #status { margin-top: 12px; font-size: 0.95rem; min-height: 1.2em; }
          @media (max-width: 720px) {
            .container { flex-direction: column; }
            .left { border-right: none; border-bottom: 1px solid #222; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="left">
            <h1>403</h1>
            <h2>Acceso Restringido</h2>
            <p>No estás autorizado para ver este contenido.</p>
            <div class="info">
              <div><strong>Tu IP:</strong> ${escapeHTML(ip)}</div>
              <div><strong>Motivo:</strong> ${escapeHTML(reason)}</div>
            </div>
          </div>
          <div class="right">
            <h2>Solicitar acceso</h2>
            <input id="name" placeholder="Nombre o usuario" autocomplete="name">
            <textarea id="reason" placeholder="¿Por qué necesitas acceso?"></textarea>
            <button id="send">Enviar solicitud</button>
            <div id="status"></div>
          </div>
        </div>
      </body>
    `;

    const btn = document.getElementById("send");
    const statusEl = document.getElementById("status");

    btn.addEventListener("click", () => sendAccessRequest(ip, btn, statusEl));
  }

  async function sendAccessRequest(ip, btn, statusEl) {
    if (state.sending) return;

    const name = (document.getElementById("name").value.trim() || "Anónimo").slice(0, 500);
    const reason = (document.getElementById("reason").value.trim() || "Sin motivo especificado").slice(0, 2000);

    state.sending = true;
    btn.disabled = true;
    statusEl.style.color = "#aaa";
    statusEl.textContent = "Enviando...";

    try {
      const payload = {
        username: "Solicitud de Acceso",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/1828/1828490.png",
        embeds: [{
          title: "🚨 Nueva solicitud de acceso",
          color: 0xe50914,
          fields: [
            { name: "Nombre", value: name, inline: true },
            { name: "IP", value: ip, inline: true },
            { name: "Motivo", value: reason || "—", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Sistema de control de acceso • " + location.hostname }
        }]
      };

      const res = await fetch(CONFIG.WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Discord: ${res.status}`);

      statusEl.style.color = "#4ade80";
      statusEl.textContent = "¡Solicitud enviada correctamente!";
      btn.textContent = "Enviado ✓";
    } catch (err) {
      console.error(err);
      statusEl.style.color = "#f87171";
      statusEl.textContent = "Error al enviar. Inténtalo de nuevo.";
    } finally {
      state.sending = false;
      btn.disabled = false;
    }
  }

  // === Lógica principal de verificación ===
  async function checkAccess() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

      const res = await fetch(CONFIG.IP_API, {
        signal: controller.signal,
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error("IP service error");

      const data = await res.json();
      const userIP = data.ip || data.query || "Desconocida";   // algunos servicios usan .query

      if (userIP !== CONFIG.ALLOWED_IP) {
        renderBlockedScreen(userIP, "IP no permitida");
      }
      // Si coincide → no hacemos nada (el contenido normal se muestra)

    } catch (err) {
      console.warn("No se pudo verificar la IP:", err);
      // Decisión: ¿bloquear o permitir en caso de error?
      renderBlockedScreen("Desconocida", "Error al verificar IP");
    }
  }

  // Iniciar
  checkAccess();

})();