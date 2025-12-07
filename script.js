// script.js - VERSIÓN QUE SÍ FUNCIONA CON GITHUB
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Competencia - Soluciones Digitales');
    
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
    
    // ======= VARIABLES =======
    let state = {
        selectedTime: 25,
        mainTimeLeft: 25 * 60,
        secondaryTimeLeft: 30,
        timerInterval: null,
        isRunning: false,
        isExtraTime: false,
        esp32Connected: false
    };
    
    // ======= INICIALIZACIÓN =======
    init();
    
    // ======= FUNCIONES PRINCIPALES =======
    function init() {
        updateDisplay();
        setupUI();
        setupEventListeners();
        initESP32Connection();
        
        // Activar primer botón de tiempo
        if (elementos.timeButtons.length > 0) {
            elementos.timeButtons[0].classList.add('active');
        }
        
        console.log('✅ Sistema iniciado');
        console.log(`📡 ESP32: ${ESP32_URL}`);
    }
    
    // ======= CRONÓMETRO =======
    function startTimer() {
        if (state.isRunning) return;
        
        state.isRunning = true;
        elementos.startBtn.disabled = true;
        elementos.pauseBtn.disabled = false;
        elementos.resetBtn.disabled = false;
        
        state.timerInterval = setInterval(() => {
            if (state.isExtraTime) {
                if (state.secondaryTimeLeft > 0) {
                    state.secondaryTimeLeft--;
                } else {
                    endExtraTime();
                }
            } else {
                if (state.mainTimeLeft > 0) {
                    state.mainTimeLeft--;
                } else {
                    startExtraTime();
                }
            }
            updateDisplay();
        }, 1000);
    }
    
    function pauseTimer() {
        clearInterval(state.timerInterval);
        state.isRunning = false;
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
    }
    
    function resetTimer() {
        clearInterval(state.timerInterval);
        state.isRunning = false;
        state.isExtraTime = false;
        state.mainTimeLeft = state.selectedTime * 60;
        state.secondaryTimeLeft = 30;
        updateDisplay();
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
        elementos.resetBtn.disabled = true;
    }
    
    function startExtraTime() {
        state.isExtraTime = true;
        state.secondaryTimeLeft = 30;
        updateDisplay();
        
        clearInterval(state.timerInterval);
        
        state.isRunning = true;
        elementos.startBtn.disabled = true;
        elementos.pauseBtn.disabled = false;
        
        state.timerInterval = setInterval(() => {
            if (state.secondaryTimeLeft > 0) {
                state.secondaryTimeLeft--;
            } else {
                endExtraTime();
            }
            updateDisplay();
        }, 1000);
    }
    
    function endExtraTime() {
        clearInterval(state.timerInterval);
        state.isRunning = false;
        state.isExtraTime = false;
        state.mainTimeLeft = state.selectedTime * 60;
        state.secondaryTimeLeft = 30;
        updateDisplay();
        elementos.startBtn.disabled = false;
        elementos.pauseBtn.disabled = true;
    }
    
    function updateDisplay() {
        if (state.isExtraTime) {
            elementos.mainTimer.textContent = "00:00";
            elementos.secondaryTimer.textContent = `+${state.secondaryTimeLeft.toString().padStart(2, '0')}`;
        } else {
            const minutes = Math.floor(state.mainTimeLeft / 60);
            const seconds = state.mainTimeLeft % 60;
            elementos.mainTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            elementos.secondaryTimer.textContent = "+30";
        }
    }
    
    // ======= ESP32 - MÉTODO QUE SÍ FUNCIONA =======
    function initESP32Connection() {
        console.log('🔌 Iniciando conexión ESP32...');
        updateStatus('🔄 Conectando...', '#FFA500');
        
        // Método 1: Usar Image para ping (evita CORS)
        testWithImage();
        
        // Método 2: Intentar cada 10 segundos
        setInterval(testWithImage, 10000);
        
        // Método 3: Verificar botón cada 2 segundos
        setInterval(checkButtonWithJSONP, 2000);
    }
    
    function testWithImage() {
        const img = new Image();
        const startTime = Date.now();
        
        img.onload = function() {
            const latency = Date.now() - startTime;
            state.esp32Connected = true;
            updateStatus(`✅ Conectado (${latency}ms)`, '#4CAF50');
            console.log(`📡 ESP32 responde en ${latency}ms`);
        };
        
        img.onerror = function() {
            state.esp32Connected = false;
            updateStatus('❌ Sin conexión', '#F44336');
        };
        
        // Usar el endpoint de imagen del ESP32
        img.src = `${ESP32_URL}/ping.gif?t=${Date.now()}`;
    }
    
    function checkButtonWithJSONP() {
        if (!state.esp32Connected) return;
        
        // Crear script para JSONP
        const scriptId = 'jsonp-' + Date.now();
        const script = document.createElement('script');
        
        script.id = scriptId;
        script.src = `${ESP32_URL}/btn?callback=handleButton&t=${Date.now()}`;
        
        // Timeout
        setTimeout(() => {
            const scriptEl = document.getElementById(scriptId);
            if (scriptEl) scriptEl.remove();
        }, 3000);
        
        // Agregar al documento
        document.body.appendChild(script);
    }
    
    // Función callback global para JSONP
    window.handleButton = function(data) {
        if (data.pressed) {
            console.log('🔄 Botón físico detectado vía JSONP');
            handlePhysicalButton();
        }
    };
    
    function handlePhysicalButton() {
        console.log('🎯 Ejecutando acción del botón físico');
        showNotification('Botón físico activado');
        
        if (state.isRunning) {
            pauseTimer();
            if (!state.isExtraTime) {
                startExtraTime();
            }
        } else {
            startExtraTime();
        }
    }
    
    // ======= INTERFAZ DE USUARIO =======
    function setupUI() {
        // Panel de estado ESP32
        const panel = document.createElement('div');
        panel.id = 'esp32-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2C3E50;
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            z-index: 10000;
            min-width: 220px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-left: 5px solid #FFA500;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <div style="font-size: 24px;">🌐</div>
                <div style="font-weight: bold; font-size: 16px;">Estado del Sistema</div>
            </div>
            <div id="esp32-status" style="margin-bottom: 8px; font-size: 14px;">
                🔄 Conectando al ESP32...
            </div>
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">
                IP: ${ESP32_IP}
            </div>
            <div id="esp32-latency" style="font-size: 11px; opacity: 0.7;">
                Latencia: -- ms
            </div>
            <div id="button-indicator" style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px; display: none;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 10px; height: 10px; background: #4CAF50; border-radius: 50%;"></div>
                    <div style="font-size: 12px;">Botón físico activado</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Botón de prueba
        const testBtn = document.createElement('button');
        testBtn.id = 'test-button';
        testBtn.innerHTML = '🔘 Probar Conexión';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s;
        `;
        
        testBtn.onmouseover = () => {
            testBtn.style.transform = 'translateY(-2px)';
            testBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        };
        
        testBtn.onmouseout = () => {
            testBtn.style.transform = 'translateY(0)';
            testBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        };
        
        testBtn.onclick = () => {
            console.log('🧪 Probando conexión manualmente...');
            testWithImage();
            handlePhysicalButton(); // También probar la acción
        };
        
        document.body.appendChild(testBtn);
    }
    
    function updateStatus(text, color) {
        const statusEl = document.getElementById('esp32-status');
        const panel = document.getElementById('esp32-panel');
        
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.style.color = color;
        }
        
        if (panel) {
            panel.style.borderLeftColor = color;
        }
    }
    
    function showNotification(message) {
        const indicator = document.getElementById('button-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        }
        
        // Notificación flotante
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 20px;">🔔</div>
                <div>${message}</div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 20000;
            animation: slideIn 0.5s ease;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        // Animación
        if (!document.getElementById('notif-animation')) {
            const style = document.createElement('style');
            style.id = 'notif-animation';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remover
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    function setupEventListeners() {
        // Botones de tiempo
        elementos.timeButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (state.isRunning) return;
                
                elementos.timeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                state.selectedTime = parseInt(this.getAttribute('data-time'));
                state.mainTimeLeft = state.selectedTime * 60;
                state.isExtraTime = false;
                updateDisplay();
            });
        });
        
        // Botones de control
        elementos.startBtn.addEventListener('click', startTimer);
        elementos.pauseBtn.addEventListener('click', pauseTimer);
        elementos.resetBtn.addEventListener('click', resetTimer);
    }
});
