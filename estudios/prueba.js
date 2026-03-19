(async function () {
    const webhookUrl = "https://discord.com/api/webhooks/1444323336816689336/gWRVUOTRGtRGA2G3TNXHQ06aa6npzVzKCqU2zmdguo8LiU8738ayuz7MFJH9SGq3hiBc";

    // 🔑 Sesión única
    const sessionId = localStorage.getItem("sessionId") || crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);

    let startTime = Date.now();
    let interactions = 0;
    let maxScroll = 0;
    let activeTime = 0;
    let lastActive = Date.now();
    let isActive = true;

    try {
        // 🌍 IP + GEO
        const ipRes = await fetch("https://ipapi.co/json/");
        const ipData = await ipRes.json();

        const baseData = {
            ip: ipData.ip,
            ciudad: ipData.city,
            pais: ipData.country_name,
            org: ipData.org,
            url: location.href,
            referrer: document.referrer || "Directo",
            idioma: navigator.language,
            plataforma: navigator.platform,
            navegador: navigator.userAgent,
            pantalla: `${screen.width}x${screen.height}`,
            cores: navigator.hardwareConcurrency,
            memoria: navigator.deviceMemory || "desconocido",
            session: sessionId
        };

        send("🟢 Nueva sesión", baseData, 3066993);

        // 🧠 Interacciones
        ["click", "keydown", "mousemove", "touchstart"].forEach(evt => {
            document.addEventListener(evt, () => {
                interactions++;
                lastActive = Date.now();
            });
        });

        // 📜 Scroll
        window.addEventListener("scroll", () => {
            const percent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            if (percent > maxScroll) maxScroll = percent;
        });

        // 👁️ Visibilidad pestaña
        document.addEventListener("visibilitychange", () => {
            isActive = !document.hidden;
            if (isActive) lastActive = Date.now();
        });

        // ⏱️ Tiempo activo
        setInterval(() => {
            if (isActive) {
                activeTime += (Date.now() - lastActive);
                lastActive = Date.now();
            }
        }, 1000);

        // ⚠️ Errores JS
        window.onerror = (msg, url, line, col) => {
            send("⚠️ Error JS", {
                msg, url, line, col, session: sessionId
            }, 15158332);
        };

        // 📋 Copy / Paste
        document.addEventListener("copy", () => {
            send("📋 Copy", { session: sessionId }, 16753920);
        });

        document.addEventListener("paste", () => {
            send("📋 Paste", { session: sessionId }, 16753920);
        });

        // 🕵️ DevTools (básico)
        setInterval(() => {
            const devtools = window.outerWidth - window.innerWidth > 160;
            if (devtools) {
                send("🛠️ DevTools abierto", { session: sessionId }, 10181046);
            }
        }, 5000);

        // 🚪 Salida → resumen
        window.addEventListener("beforeunload", () => {
            const totalTime = Math.floor((Date.now() - startTime) / 1000);

            const interes =
                interactions > 20 ? "🔥 Alto" :
                    interactions > 5 ? "🟡 Medio" :
                        "⚪ Bajo";

            send("📊 Resumen sesión", {
                tiempo_total: totalTime + "s",
                tiempo_activo: Math.floor(activeTime / 1000) + "s",
                interacciones: interactions,
                scroll_max: maxScroll + "%",
                interes: interes,
                session: sessionId
            }, 3447003);
        });

    } catch (err) {
        console.error(err);
    }

    // 🚀 EMBED PRO
    function send(title, data, color) {
        fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [{
                    title: title,
                    color: color,

                    thumbnail: {
                        url: "https://api.dicebear.com/7.x/identicon/svg?seed=" + (data.ip || Math.random())
                    },

                    description: `
🌍 **IP:** ${data.ip || "?"}
📍 **Ubicación:** ${data.ciudad || "?"}, ${data.pais || "?"}
🏢 **ISP:** ${data.org || "?"}
          `,

                    fields: [
                        {
                            name: "🌐 Navegación",
                            value:
                                `URL: ${data.url || "?"}\n` +
                                `Referrer: ${data.referrer || "Directo"}`,
                            inline: false
                        },
                        {
                            name: "💻 Sistema",
                            value:
                                `SO: ${data.plataforma || "?"}\n` +
                                `Idioma: ${data.idioma || "?"}`,
                            inline: true
                        },
                        {
                            name: "🖥️ Hardware",
                            value:
                                `Pantalla: ${data.pantalla || "?"}\n` +
                                `CPU: ${data.cores || "?"}\n` +
                                `RAM: ${data.memoria || "?"}`,
                            inline: true
                        },
                        {
                            name: "🧠 Sesión",
                            value: `ID: ${data.session || "?"}`,
                            inline: false
                        }
                    ],

                    footer: {
                        text: "Tracker PRO • " + new Date().toLocaleTimeString()
                    },

                    timestamp: new Date().toISOString()
                }]
            })
        });
    }
})();