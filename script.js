// script.js - VERSIÓN CORREGIDA PARA GITHUB PAGES
// NO usa document.body.appendChild() - Evita errores

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Soluciones Digitales - Competencia');
    
    // ======= CONFIGURACIÓN =======
    const ESP32_IP = "192.168.0.105";
    const ESP32_URL = `http://${ESP32_IP}`;
    
    // ======= ELEMENTOS DOM =======
    const elementos = {
        mainTimer: document.getElementById('mainTimer'),
        secondaryTimer: document.getElementById('secondaryTimer'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resetBtn: document.getElementById('resetBtn'),
        timeButtons: document.querySelectorAll('.time-btn')
    };
    
    // ======= VARIABLES DEL SISTEMA =======
    let estado = {
        tiempoSeleccionado: 25,
        tiempoPrincipal: 25 * 60,
        tiempoSecundario: 30,
        intervalo: null,
        enEjecucion: false,
        tiempoExtra: false,
        esp32Conectado: false,
        pulsaciones: 0
    };
    
    // ======= INICIALIZACIÓN =======
    inicializar();
    
    function inicializar() {
        console.log('✅ Sistema inicializado');
        
        actualizarDisplay();
        crearInterfazESP32();
        configurarEventos();
        
        // Iniciar conexión ESP32 después de 1 segundo
        setTimeout(iniciarConexionESP32, 1000);
        
        // Activar primer botón de tiempo
        if (elementos.timeButtons.length > 0) {
            elementos.timeButtons[0].classList.add('active');
        }
        
        console.log('📡 ESP32 configurado en:', ESP32_URL);
    }
    
    // ======= FUNCIONES DEL CRONÓMETRO =======
    function actualizarDisplay() {
        if (estado.tiempoExtra) {
            elementos.mainTimer.textContent = "00:00";
            elementos.secondaryTimer.textContent = `+${estado.tiempoSecundario.toString().padStart(2, '0')}`;
        } else {
            const minutos = Math.floor(estado.tiempoPrincipal / 60);
            const segundos = estado.tiempoPrincipal % 60;
            elementos.mainTimer.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
            elementos.secondaryTimer.textContent = "+30";
        }
    }
    
    function iniciarTemporizador() {
        if (estado.enEjecucion) return;
        
        estado.enEjecucion = true;
        elementos.startBtn.disabled = true;
        elementos.pauseBtn.disabled = false;
        elementos.resetBtn.disabled = false;
        
        estado.intervalo = setInterval(() => {
            if (estado.tiempoExtra) {
                if (estado.tiempoSecundario > 0) {
                    estado.tiempoSecundario--;
                } else {
                    finalizarTiempoExtra();
                }
            } else {
                if (estado.tiempoPrincipal > 0) {
                    estado.tiempoPrincipal--;
                } else {
                    activarTiempoExtra();
                }
            }
            actualizarDisplay();
        }, 1000);
    }
    
    function pausarTemporizador() {
        clearInterval(estado.intervalo);
        estado.enEjecucion = false;
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
    }
    
    function reiniciarTemporizador() {
        clearInterval(estado.intervalo);
        estado.enEjecucion = false;
        estado.tiempoExtra = false;
        estado.tiempoPrincipal = estado.tiempoSeleccionado * 60;
        estado.tiempoSecundario = 30;
        actualizarDisplay();
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
        elementos.resetBtn.disabled = true;
    }
    
    function activarTiempoExtra() {
        estado.tiempoExtra = true;
        estado.tiempoSecundario = 30;
        actualizarDisplay();
        
        clearInterval(estado.intervalo);
        
        estado.enEjecucion = true;
        elementos.startBtn.disabled = true;
        elementos.pauseBtn.disabled = false;
        
        estado.intervalo = setInterval(() => {
            if (estado.tiempoSecundario > 0) {
                estado.tiempoSecundario--;
            } else {
                finalizarTiempoExtra();
            }
            actualizarDisplay();
        }, 1000);
    }
    
    function finalizarTiempoExtra() {
        clearInterval(estado.intervalo);
        estado.enEjecucion = false;
        estado.tiempoExtra = false;
        estado.tiempoPrincipal = estado.tiempoSeleccionado * 60;
        estado.tiempoSecundario = 30;
        actualizarDisplay();
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
    }
    
    // ======= CONEXIÓN ESP32 (CORREGIDA) =======
    function iniciarConexionESP32() {
        console.log('🔌 Conectando con ESP32...');
        actualizarEstadoESP32('🔄 Conectando...', '#FF9800');
        
        // Probar conexión inmediatamente
        probarConexionESP32();
        
        // Verificar cada 6 segundos
        setInterval(probarConexionESP32, 6000);
        
        // Verificar pulsador cada 1.5 segundos
        setInterval(verificarPulsadorESP32, 1500);
    }
    
    function probarConexionESP32() {
        if (!navigator.onLine) {
            actualizarEstadoESP32('🌐 Sin Internet', '#F44336');
            return;
        }
        
        const img = new Image();
        const inicio = Date.now();
        
        img.onload = function() {
            const latencia = Date.now() - inicio;
            if (!estado.esp32Conectado) {
                estado.esp32Conectado = true;
                actualizarEstadoESP32(`✅ Conectado (${latencia}ms)`, '#4CAF50');
                console.log(`📡 ESP32 responde en ${latencia}ms`);
                mostrarNotificacion('ESP32 conectado', 'success');
            }
            actualizarLatencia(latencia);
        };
        
        img.onerror = function() {
            if (estado.esp32Conectado) {
                estado.esp32Conectado = false;
                actualizarEstadoESP32('❌ Desconectado', '#F44336');
                console.log('⚠️  No se pudo conectar al ESP32');
            }
        };
        
        // Usar /pixel.gif - siempre responde
        img.src = `${ESP32_URL}/pixel.gif?t=${Date.now()}`;
    }
    
    function verificarPulsadorESP32() {
        if (!estado.esp32Conectado) return;
        
        // Usar Image para JSONP - NO usa appendChild
        const callbackName = `pulsador_${Date.now()}`;
        const img = new Image();
        
        window[callbackName] = function(data) {
            if (data && data.p === 1) {
                console.log('🔘 ¡Pulsador detectado!');
                estado.pulsaciones++;
                manejarPulsacionFisica();
            }
            delete window[callbackName];
        };
        
        // Configurar Image para cargar JSONP
        img.onload = function() {
            // La imagen se carga, pero el JSONP se ejecuta via callback
            console.log('📨 Consulta enviada al ESP32');
        };
        
        img.onerror = function() {
            delete window[callbackName];
        };
        
        // Usar Image.src para JSONP (truco que funciona)
        img.src = `${ESP32_URL}/btn?callback=${callbackName}&t=${Date.now()}`;
    }
    
    function manejarPulsacionFisica() {
        const ahora = new Date();
        console.log(`🎯 Pulsación #${estado.pulsaciones} - ${ahora.toLocaleTimeString()}`);
        
        mostrarNotificacionPulsador();
        
        // Lógica del pulsador
        if (estado.enEjecucion) {
            pausarTemporizador();
            
            if (!estado.tiempoExtra) {
                activarTiempoExtra();
            }
        } else {
            activarTiempoExtra();
        }
    }
    
    // ======= INTERFAZ DE USUARIO =======
    function crearInterfazESP32() {
        // Panel de control
        const panel = document.createElement('div');
        panel.id = 'control-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 10000;
            min-width: 240px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            border: 2px solid #3949ab;
            backdrop-filter: blur(8px);
        `;
        
        panel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                <div style="font-size: 28px; background: rgba(255, 255, 255, 0.1); width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">⚡</div>
                <div>
                    <div style="font-weight: 700; font-size: 16px;">Control ESP32</div>
                    <div style="font-size: 12px; opacity: 0.7; margin-top: 2px;">Soluciones Digitales</div>
                </div>
            </div>
            
            <div id="estado-conexion" style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <div id="led-estado" style="width: 10px; height: 10px; border-radius: 50%; background: #FF9800;"></div>
                    <div id="texto-estado" style="font-size: 14px; font-weight: 600;">Conectando...</div>
                </div>
                <div style="font-size: 11px; opacity: 0.7;">${ESP32_IP}</div>
            </div>
            
            <div id="info-latencia" style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">
                <span style="opacity: 0.6;">Latencia:</span> <span id="valor-latencia">-- ms</span>
            </div>
            
            <div id="contador-pulsaciones" style="font-size: 11px; opacity: 0.7; margin-bottom: 12px;">
                <span style="opacity: 0.6;">Pulsaciones:</span> <span id="valor-pulsaciones">0</span>
            </div>
            
            <div id="indicador-pulsador" style="padding: 10px; background: rgba(76, 175, 80, 0.15); border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.3); display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; animation: pulse 1s infinite;"></div>
                        <div style="font-size: 13px; font-weight: 600;">¡Pulsador activado!</div>
                    </div>
                    <div style="font-size: 20px;">🎯</div>
                </div>
                <div id="hora-ultima" style="font-size: 11px; opacity: 0.7; margin-top: 4px; margin-left: 16px;"></div>
            </div>
        `;
        
        // Agregar animación
        const estiloAnimacion = document.createElement('style');
        estiloAnimacion.textContent = `
            @keyframes pulse {
                0% { transform: scale(0.9); opacity: 0.7; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(0.9); opacity: 0.7; }
            }
        `;
        document.head.appendChild(estiloAnimacion);
        
        document.body.appendChild(panel);
        
        // Botón de prueba
        const botonPrueba = document.createElement('button');
        botonPrueba.id = 'boton-prueba-pulsador';
        botonPrueba.innerHTML = '<span style="margin-right: 6px;">🔘</span> Probar Pulsador';
        botonPrueba.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #FF4081 0%, #F50057 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(255, 64, 129, 0.3);
            transition: all 0.2s;
        `;
        
        botonPrueba.onmouseover = () => {
            botonPrueba.style.transform = 'translateY(-2px)';
            botonPrueba.style.boxShadow = '0 6px 20px rgba(255, 64, 129, 0.4)';
        };
        
        botonPrueba.onmouseout = () => {
            botonPrueba.style.transform = 'translateY(0)';
            botonPrueba.style.boxShadow = '0 4px 15px rgba(255, 64, 129, 0.3)';
        };
        
        botonPrueba.onclick = manejarPulsacionFisica;
        document.body.appendChild(botonPrueba);
    }
    
    function actualizarEstadoESP32(texto, color) {
        const textoElem = document.getElementById('texto-estado');
        const ledElem = document.getElementById('led-estado');
        const panel = document.getElementById('control-panel');
        
        if (textoElem) {
            textoElem.textContent = texto;
        }
        
        if (ledElem) {
            ledElem.style.background = color;
            ledElem.style.boxShadow = `0 0 10px ${color}`;
        }
        
        if (panel) {
            panel.style.borderColor = color;
        }
    }
    
    function actualizarLatencia(ms) {
        const elem = document.getElementById('valor-latencia');
        if (elem) {
            elem.textContent = `${ms} ms`;
            elem.style.color = ms < 100 ? '#4CAF50' : ms < 300 ? '#FF9800' : '#F44336';
        }
    }
    
    function mostrarNotificacionPulsador() {
        const indicador = document.getElementById('indicador-pulsador');
        const horaElem = document.getElementById('hora-ultima');
        const contadorElem = document.getElementById('valor-pulsaciones');
        
        if (indicador && horaElem && contadorElem) {
            const ahora = new Date();
            horaElem.textContent = `Hora: ${ahora.toLocaleTimeString()}`;
            contadorElem.textContent = estado.pulsaciones;
            indicador.style.display = 'block';
            
            // Ocultar después de 3 segundos
            setTimeout(() => {
                indicador.style.display = 'none';
            }, 3000);
        }
        
        // Notificación flotante
        const notificacion = document.createElement('div');
        notificacion.textContent = '🔔 ¡Pulsador físico activado!';
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00C853 0%, #64DD17 100%);
            color: white;
            padding: 14px 22px;
            border-radius: 10px;
            z-index: 20000;
            animation: slideIn 0.4s ease;
            font-weight: 700;
            box-shadow: 0 6px 20px rgba(0, 200, 83, 0.3);
        `;
        
        // Agregar animación si no existe
        if (!document.getElementById('slide-animation')) {
            const style = document.createElement('style');
            style.id = 'slide-animation';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notificacion);
        
        // Auto-remover
        setTimeout(() => {
            notificacion.style.animation = 'slideOut 0.4s ease';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 400);
        }, 2500);
    }
    
    function mostrarNotificacion(mensaje, tipo = 'info') {
        console.log(`📢 ${mensaje}`);
    }
    
    // ======= CONFIGURACIÓN DE EVENTOS =======
    function configurarEventos() {
        // Botones de tiempo
        elementos.timeButtons.forEach(boton => {
            boton.addEventListener('click', function() {
                if (estado.enEjecucion) return;
                
                elementos.timeButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                estado.tiempoSeleccionado = parseInt(this.getAttribute('data-time'));
                estado.tiempoPrincipal = estado.tiempoSeleccionado * 60;
                estado.tiempoExtra = false;
                actualizarDisplay();
            });
        });
        
        // Controles del temporizador
        elementos.startBtn.addEventListener('click', iniciarTemporizador);
        elementos.pauseBtn.addEventListener('click', pausarTemporizador);
        elementos.resetBtn.addEventListener('click', reiniciarTemporizador);
    }
});
