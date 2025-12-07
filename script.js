// script.js - VERSIÓN QUE EVITA TIMEOUT
document.addEventListener('DOMContentLoaded', function() {
    console.log('⏱️ Sistema Temporizador - Modo Simple');
    
    // CONFIGURACIÓN
    const ESP32_IP = "192.168.0.105";
    let esp32Online = false;
    let lastCheck = 0;
    
    // ELEMENTOS
    const elementos = {
        mainTimer: document.getElementById('mainTimer'),
        secondaryTimer: document.getElementById('secondaryTimer'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resetBtn: document.getElementById('resetBtn'),
        timeButtons: document.querySelectorAll('.time-btn')
    };
    
    // ESTADO
    let estado = {
        tiempo: 25 * 60,
        extra: 30,
        intervalo: null,
        corriendo: false,
        tiempoExtra: false
    };
    
    // INICIALIZAR
    init();
    
    function init() {
        actualizarDisplay();
        crearPanel();
        setupEventos();
        
        // Conectar ESP32
        setTimeout(conectarESP32, 1000);
        
        // Botón activo por defecto
        if (elementos.timeButtons.length > 0) {
            elementos.timeButtons[0].classList.add('active');
        }
    }
    
    // ======= TEMPORIZADOR =======
    function actualizarDisplay() {
        if (estado.tiempoExtra) {
            elementos.mainTimer.textContent = "00:00";
            elementos.secondaryTimer.textContent = `+${estado.extra.toString().padStart(2, '0')}`;
        } else {
            const min = Math.floor(estado.tiempo / 60);
            const seg = estado.tiempo % 60;
            elementos.mainTimer.textContent = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
            elementos.secondaryTimer.textContent = "+30";
        }
    }
    
    function iniciar() {
        if (estado.corriendo) return;
        estado.corriendo = true;
        elementos.startBtn.disabled = true;
        elementos.pauseBtn.disabled = false;
        
        estado.intervalo = setInterval(() => {
            if (estado.tiempoExtra) {
                if (estado.extra > 0) {
                    estado.extra--;
                } else {
                    clearInterval(estado.intervalo);
                    estado.corriendo = false;
                    estado.tiempoExtra = false;
                    estado.tiempo = 25 * 60;
                    estado.extra = 30;
                    elementos.startBtn.disabled = false;
                    elementos.pauseBtn.disabled = true;
                }
            } else {
                if (estado.tiempo > 0) {
                    estado.tiempo--;
                } else {
                    estado.tiempoExtra = true;
                    estado.extra = 30;
                }
            }
            actualizarDisplay();
        }, 1000);
    }
    
    function pausar() {
        clearInterval(estado.intervalo);
        estado.corriendo = false;
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
    }
    
    function reiniciar() {
        clearInterval(estado.intervalo);
        estado.corriendo = false;
        estado.tiempoExtra = false;
        estado.tiempo = 25 * 60;
        estado.extra = 30;
        actualizarDisplay();
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
        elementos.resetBtn.disabled = true;
    }
    
    // ======= ESP32 - MÉTODO QUE SÍ FUNCIONA =======
    function conectarESP32() {
        console.log('🔄 Conectando ESP32...');
        actualizarEstado('Conectando...', '#FF9800');
        
        // Método 1: Usar Image (NO bloqueado por CORS)
        verificarConexion();
        
        // Verificar cada 4 segundos
        setInterval(verificarConexion, 4000);
        
        // Verificar pulsador cada 2 segundos
        setInterval(verificarPulsador, 2000);
    }
    
    function verificarConexion() {
        const img = new Image();
        const inicio = Date.now();
        
        img.onload = function() {
            const latencia = Date.now() - inicio;
            if (!esp32Online) {
                esp32Online = true;
                actualizarEstado(`Conectado (${latencia}ms)`, '#4CAF50');
                console.log(`✅ ESP32 responde en ${latencia}ms`);
            }
            actualizarLatencia(latencia);
            lastCheck = Date.now();
        };
        
        img.onerror = function() {
            if (esp32Online) {
                esp32Online = false;
                actualizarEstado('Desconectado', '#F44336');
                console.log('❌ No se pudo conectar');
            }
        };
        
        // Usar /pixel.gif que siempre responde
        img.src = `http://${ESP32_IP}/pixel.gif?t=${Date.now()}`;
    }
    
    function verificarPulsador() {
        if (!esp32Online) return;
        
        // Crear script para JSONP (única forma que funciona desde HTTPS)
        const scriptId = 'jsonp-' + Date.now();
        const script = document.createElement('script');
        
        script.id = scriptId;
        script.src = `http://${ESP32_IP}/btn?callback=handleBtn&t=${Date.now()}`;
        
        // Auto-remover después de 2 segundos
        setTimeout(() => {
            const s = document.getElementById(scriptId);
            if (s) s.remove();
        }, 2000);
        
        document.body.appendChild(script);
    }
    
    // Función callback global (debe estar en window)
    window.handleBtn = function(data) {
        if (data && data.p === 1) {
            console.log('🔘 ¡Pulsador presionado!');
            accionPulsador();
        }
    };
    
    function accionPulsador() {
        mostrarNotificacion('Pulsador activado');
        
        if (estado.corriendo) {
            pausar();
            if (!estado.tiempoExtra) {
                estado.tiempoExtra = true;
                estado.extra = 30;
                actualizarDisplay();
                iniciar();
            }
        } else {
            estado.tiempoExtra = true;
            estado.extra = 30;
            actualizarDisplay();
            iniciar();
        }
    }
    
    // ======= INTERFAZ =======
    function crearPanel() {
        const panel = document.createElement('div');
        panel.id = 'esp32-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: Arial;
            z-index: 10000;
            font-size: 13px;
            min-width: 180px;
            border-left: 4px solid #FF9800;
        `;
        
        panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">ESP32 Status</div>
            <div id="status-text">Conectando...</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
                IP: ${ESP32_IP}
            </div>
            <div id="latency" style="font-size: 11px; opacity: 0.7; margin-top: 2px;">
                Latencia: -- ms
            </div>
            <button id="test-btn" style="margin-top: 10px; padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 12px;">
                Probar Pulsador
            </button>
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('test-btn').addEventListener('click', accionPulsador);
    }
    
    function actualizarEstado(texto, color) {
        const status = document.getElementById('status-text');
        const panel = document.getElementById('esp32-panel');
        
        if (status) {
            status.textContent = texto;
            status.style.color = color;
        }
        
        if (panel) {
            panel.style.borderLeftColor = color;
        }
    }
    
    function actualizarLatencia(ms) {
        const elem = document.getElementById('latency');
        if (elem) {
            elem.textContent = `Latencia: ${ms} ms`;
            elem.style.color = ms < 100 ? '#4CAF50' : ms < 300 ? '#FF9800' : '#F44336';
        }
    }
    
    function mostrarNotificacion(texto) {
        const noti = document.createElement('div');
        noti.textContent = texto;
        noti.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 20000;
            font-weight: bold;
            animation: slideIn 0.3s;
        `;
        
        // Animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(noti);
        
        setTimeout(() => {
            noti.remove();
            style.remove();
        }, 2000);
    }
    
    function setupEventos() {
        // Botones de tiempo
        elementos.timeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                if (estado.corriendo) return;
                elementos.timeButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                estado.tiempo = parseInt(this.getAttribute('data-time')) * 60;
                estado.tiempoExtra = false;
                actualizarDisplay();
            });
        });
        
        // Controles
        elementos.startBtn.addEventListener('click', iniciar);
        elementos.pauseBtn.addEventListener('click', pausar);
        elementos.resetBtn.addEventListener('click', reiniciar);
    }
});
