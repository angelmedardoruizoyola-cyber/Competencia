// script.js - VERSIÓN SIMPLE PARA PULSADOR
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema Pulsador ESP32');
    
    const ESP32_IP = "192.168.0.105";
    let esp32Conectado = false;
    
    // Elementos
    const mainTimer = document.getElementById('mainTimer');
    const secondaryTimer = document.getElementById('secondaryTimer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Variables del temporizador
    let tiempoSeleccionado = 25;
    let tiempoPrincipal = tiempoSeleccionado * 60;
    let tiempoSecundario = 30;
    let intervalo = null;
    let enEjecucion = false;
    let tiempoExtra = false;
    
    // Inicializar
    actualizarDisplay();
    crearPanelControl();
    
    // Event Listeners
    startBtn.addEventListener('click', iniciarTemporizador);
    pauseBtn.addEventListener('click', pausarTemporizador);
    resetBtn.addEventListener('click', reiniciarTemporizador);
    
    // Conectar ESP32 después de 2 segundos
    setTimeout(conectarESP32, 2000);
    
    // ======= FUNCIONES TEMPORIZADOR =======
    function iniciarTemporizador() {
        if (enEjecucion) return;
        enEjecucion = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        intervalo = setInterval(() => {
            if (tiempoExtra) {
                if (tiempoSecundario > 0) {
                    tiempoSecundario--;
                } else {
                    clearInterval(intervalo);
                    enEjecucion = false;
                    tiempoExtra = false;
                    tiempoPrincipal = tiempoSeleccionado * 60;
                    tiempoSecundario = 30;
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                }
            } else {
                if (tiempoPrincipal > 0) {
                    tiempoPrincipal--;
                } else {
                    tiempoExtra = true;
                    tiempoSecundario = 30;
                }
            }
            actualizarDisplay();
        }, 1000);
    }
    
    function pausarTemporizador() {
        clearInterval(intervalo);
        enEjecucion = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    function reiniciarTemporizador() {
        clearInterval(intervalo);
        enEjecucion = false;
        tiempoExtra = false;
        tiempoPrincipal = tiempoSeleccionado * 60;
        tiempoSecundario = 30;
        actualizarDisplay();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
    }
    
    function actualizarDisplay() {
        if (tiempoExtra) {
            mainTimer.textContent = "00:00";
            secondaryTimer.textContent = `+${tiempoSecundario.toString().padStart(2, '0')}`;
        } else {
            const minutos = Math.floor(tiempoPrincipal / 60);
            const segundos = tiempoPrincipal % 60;
            mainTimer.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
            secondaryTimer.textContent = "+30";
        }
    }
    
    // ======= CONEXIÓN ESP32 =======
    function conectarESP32() {
        console.log('Conectando ESP32...');
        actualizarEstado('Conectando...', 'orange');
        
        // Probar conexión
        probarConexion();
        
        // Verificar cada 5 segundos
        setInterval(probarConexion, 5000);
        
        // Verificar pulsador cada 1 segundo
        setInterval(verificarPulsador, 1000);
    }
    
    function probarConexion() {
        const img = new Image();
        img.onload = function() {
            if (!esp32Conectado) {
                esp32Conectado = true;
                actualizarEstado('Conectado', 'green');
                console.log('✅ ESP32 conectado');
            }
        };
        img.onerror = function() {
            if (esp32Conectado) {
                esp32Conectado = false;
                actualizarEstado('Desconectado', 'red');
            }
        };
        img.src = `http://${ESP32_IP}/ping.gif?t=${Date.now()}`;
    }
    
    function verificarPulsador() {
        if (!esp32Conectado) return;
        
        const script = document.createElement('script');
        script.src = `http://${ESP32_IP}/pulsador-evento?callback=manejarPulsador&t=${Date.now()}`;
        document.body.appendChild(script);
        
        setTimeout(() => script.remove(), 3000);
    }
    
    window.manejarPulsador = function(data) {
        if (data.event === true || data.evento_detectado === true) {
            console.log('🔘 Pulsador detectado');
            manejarAccionPulsador();
        }
    };
    
    function manejarAccionPulsador() {
        // Mostrar notificación
        mostrarNotificacion('¡Pulsador activado!');
        
        // Acción: pausar si está corriendo
        if (enEjecucion) {
            pausarTemporizador();
            // Activar tiempo extra si no está activo
            if (!tiempoExtra) {
                tiempoExtra = true;
                tiempoSecundario = 30;
                actualizarDisplay();
                iniciarTemporizador();
            }
        } else {
            // Si no está corriendo, iniciar tiempo extra
            tiempoExtra = true;
            tiempoSecundario = 30;
            actualizarDisplay();
            iniciarTemporizador();
        }
    }
    
    // ======= INTERFAZ =======
    function crearPanelControl() {
        const panel = document.createElement('div');
        panel.id = 'control-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial;
            z-index: 10000;
            min-width: 200px;
        `;
        
        panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">Control Pulsador</div>
            <div id="estado-esp32" style="margin-bottom: 5px;">Estado: Conectando...</div>
            <div style="font-size: 12px;">IP: ${ESP32_IP}</div>
            <button id="btn-probar" style="margin-top: 10px; padding: 8px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                Probar Pulsador
            </button>
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('btn-probar').addEventListener('click', manejarAccionPulsador);
    }
    
    function actualizarEstado(texto, color) {
        const elemento = document.getElementById('estado-esp32');
        const panel = document.getElementById('control-panel');
        
        if (elemento) {
            elemento.textContent = `Estado: ${texto}`;
            elemento.style.color = color;
        }
        
        if (panel) {
            panel.style.borderLeft = `4px solid ${color}`;
        }
    }
    
    function mostrarNotificacion(mensaje) {
        const notificacion = document.createElement('div');
        notificacion.textContent = mensaje;
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 20000;
            font-weight: bold;
            animation: aparecer 0.5s;
        `;
        
        const estilo = document.createElement('style');
        estilo.textContent = `
            @keyframes aparecer {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(estilo);
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.remove();
            estilo.remove();
        }, 3000);
    }
});
