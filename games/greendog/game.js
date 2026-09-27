// games/greendog/game.js
// Greendog en WASA Games
// v1: detecta MUERTE via heap[0x5A6B9C], muestra anuncio, reanuda.

export function init(container, args) {
    // ============================================================
    // CONFIGURACIÓN
    // ============================================================
    const DIRECCION_VIDAS = 0x5A6B9C;
    const POLLING_MS = 200;
    const URL_ROM = "/games/greendog/greendog.zip";

    // ============================================================
    // ESTADO
    // ============================================================
    let vidasAnteriores = null;
    let esperandoEvento = false;
    let _callbackAnuncio = null;

    // ============================================================
    // HELPERS
    // ============================================================
    function obtenerHeap() {
        const emu = window.EJS_emulator;
        if (!emu || !emu.gameManager) return null;
        const Mod = emu.gameManager.Module;
        if (!Mod) return null;
        return Mod.HEAPU8 || (Mod.wasmMemory ? new Uint8Array(Mod.wasmMemory.buffer) : null);
    }

    function pausarEmulador() {
        const emu = window.EJS_emulator;
        if (emu && emu.gameManager) {
            emu.gameManager.toggleMainLoop(0);
            console.log("[greendog] ⏸️ Pausado");
        }
    }

    function reanudarEmulador() {
        const emu = window.EJS_emulator;
        if (emu && emu.gameManager) {
            emu.gameManager.toggleMainLoop(1);
            console.log("[greendog] ▶️ Reanudado");
        }
    }

    // ============================================================
    // ANUNCIOS (mismo sistema window.vrAd que ya usa tu index.html)
    // ============================================================
    function abrirAnuncio(callback) {
        if (window.vrAd !== 0 && window.vrAd !== undefined) {
            console.warn("[greendog] Ya hay un anuncio en curso");
            return;
        }
        _callbackAnuncio = callback;
        window.vrAdType = "greendog";
        window.vrAd = 1;
        console.log("[greendog] 📺 Anuncio solicitado");
    }

    const watcherAnuncio = setInterval(() => {
        if (window.vrAd === 4 && _callbackAnuncio) {
            const cb = _callbackAnuncio;
            _callbackAnuncio = null;
            window.vrAd = 0;
            window.vrAdType = null;
            console.log("[greendog] ✅ Anuncio terminado");
            cb();
        }
    }, 150);

    // ============================================================
    // MANEJO DE MUERTE
    // ============================================================
    function onMuerte() {
        if (esperandoEvento) return;
        esperandoEvento = true;
        console.log("[greendog] 💀 Muerte detectada");

        pausarEmulador();

        abrirAnuncio(() => {
            console.log("[greendog] Muerte: reanudando sin recompensa");
            reanudarEmulador();
            esperandoEvento = false;
        });
    }

    // ============================================================
    // MONITOREO DE VIDAS
    // ============================================================
    function iniciarMonitoreo() {
        setInterval(() => {
            if (esperandoEvento) return;
            const heap = obtenerHeap();
            if (!heap) return;

            const vidas = heap[DIRECCION_VIDAS];

            if (vidasAnteriores === null) {
                vidasAnteriores = vidas;
                console.log("[greendog] Vidas iniciales:", vidas);
                return;
            }

            if (vidas < vidasAnteriores) {
                onMuerte();
            }

            vidasAnteriores = vidas;
        }, POLLING_MS);
    }

    // ============================================================
    // INICIALIZAR EMULATORJS
    // ============================================================
    container.innerHTML = `
        <style>
            #greendog-game {
                width: 100%;
                height: 100%;
                min-height: 500px;
                background: #000;
            }
            #greendog-game canvas {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain;
            }
        </style>
        <div id="greendog-game"></div>
    `;

    window.EJS_player = "#greendog-game";
    window.EJS_core = "segaMD";
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_gameUrl = URL_ROM;
    window.EJS_startOnLoaded = true;
    window.EJS_Buttons = {
        playPause: true,
        restart: true,
        saveState: true,
        loadState: true,
        gamepad: true,
        cheat: false,
        volume: true,
        saveSavFiles: true
    };

    window.EJS_onGameStart = function() {
        console.log("[greendog] 🎮 Juego iniciado");
        iniciarMonitoreo();
    };

    const loader = document.createElement("script");
    loader.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    document.head.appendChild(loader);

    // ============================================================
    // CLEANUP
    // ============================================================
    container._cleanup = () => {
        clearInterval(watcherAnuncio);
        window.vrAd = 0;
        window.vrAdType = null;
        _callbackAnuncio = null;
        console.log("[greendog] Cleanup ejecutado");
    };
}
