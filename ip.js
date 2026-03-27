(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69",
    IP_API: "https://api.ipify.org?format=json",
    WEBHOOK: "https://discord.com/api/webhooks/1459251137386516584/IdR-wExor-ezEQ88YxRJM-v5NS43WtAqJP-Q6bDv0XnOSYD47bzhh2pxSIW_TIBMcRoR",
    TIMEOUT_MS: 8000
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
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a0f, #12121a);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            width: 100%;
            max-width: 820px;
            background: #16161f;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            border: 1px solid #222;
          }
          .main { display: flex; flex-direction: column; }
          .left {
            padding: 48px;
            background: #1a1a24;
            border-bottom: 1px solid #222;
          }
          .right {
            padding: 48px;
          }
          h1 {
            font-size: clamp(3.5rem, 8vw, 5rem);
            color: #e50914;
            line-height: 1;
            margin-bottom: 12px;
          }
          h2 { font-size: 1.75rem; margin-bottom: 20px; font-weight: 600; }
          p { color: #bbb; line-height: 1.6; margin-bottom: 24px; }
          .info div {
            background: #21212b;
            padding: 14px 16px;
            border-radius: 10px;
            margin-bottom: 12px;
            font-size: 0.97rem;
          }
          input, textarea {
            width: 100%;
            padding: 14px 16px;
            margin-bottom: 16px;
            background: #21212b;
            border: 1px solid #333;
            border-radius: 10px;
            color: #fff;
            font-size: 1rem;
          }
          textarea { min-height: 120px; resize: vertical; }
          button {
            width: 100%;
            background: #e50914;
            color: white;
            border: none;
            padding: 15px;
            font-size: 1.08rem;
            font-weight: 700;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.25s;
          }
          button:hover:not(:disabled) { background: #f22; transform: translateY(-2px); }
          button:disabled { background: #555; cursor: not-allowed; }
          #status { margin-top: 14px; font-size: 0.98rem; text-align: center; min-height: 1.4em; }
          @media (min-width: 768px) {
            .main { flex-direction: row; }
            .left { border-bottom: none; border-right: 1px solid #222; flex: 1.35; }
            .right { flex: 1; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="main">
            <div class="left">
              <h1>403</h1>
              <h2>Acceso Restringido</h2>
              <p>No estás autorizado para ver este contenido.</p>
              <div class="info">
                <div><strong>Tu IP:</strong> ${escapeHTML(ip)}</div>
                <div><strong>Estado:</strong> ${escapeHTML(reason)}</div>
              </div>
            </div>
            <div class="right">
              <h2>Solicitar acceso</h2>
              <input id="name" placeholder="Nombre o usuario" maxlength="80">
              <textarea id="reason" placeholder="¿Por qué necesitas acceso?"></textarea>
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
    const reason = (document.getElementById("reason").value.trim() || "Sin motivo").slice(0, 1500);

    btn.disabled = true;
    statusEl.style.color = "#aaa";
    statusEl.textContent = "Enviando solicitud...";

    try {
      const payload = {
        username: "Solicitud de Acceso",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/1828/1828490.png",
        content: `**Nueva solicitud de acceso**\n\n**Nombre:** ${name}\n**IP:** ${currentIP}\n**Motivo:** ${reason}\n\nDesde: ${location.hostname}`
      };

      await fetch(CONFIG.WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors",           // ← Importante para GitHub Pages
        cache: "no-store"
      });

      statusEl.style.color = "#4ade80";
      statusEl.textContent = "✅ Solicitud enviada correctamente.";
      btn.textContent = "✓ Enviado";
      btn.disabled = true;

    } catch (err) {
      console.error("Error:", err);
      statusEl.style.color = "#f87171";
      statusEl.textContent = "❌ No se pudo enviar. Inténtalo de nuevo.";
    } finally {
      isSending = false;
    }
  }

  // ==================== Verificación de IP ====================
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    const res = await fetch(CONFIG.IP_API, {
      signal: controller.signal,
      cache: "no-store"
    });

    clearTimeout(timeout);
    const data = await res.json();
    const userIP = data.ip || data.query || "Desconocida";

    if (userIP !== CONFIG.ALLOWED_IP) {
      renderBlockedScreen(userIP, "IP no permitida");
    }
    // Si la IP coincide → no se bloquea la página

  } catch (err) {
    console.warn("Error verificando IP:", err);
    renderBlockedScreen("Desconocida", "Error al verificar la IP");
  }

})();