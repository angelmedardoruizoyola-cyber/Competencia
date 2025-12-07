// script.js - VERSIÓN SIMPLIFICADA QUE FUNCIONA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    
    // ======= ELEMENTOS DOM =======
    const mainTimer = document.getElementById('mainTimer');
    const secondaryTimer = document.getElementById('secondaryTimer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const timeButtons = document.querySelectorAll('.time-btn');
    
    // ======= VARIABLES CRONÓMETRO =======
    let selectedTime = 25;
    let mainTimeLeft = selectedTime * 60;
    let secondaryTimeLeft = 30;
    let timerInterval;
    let isRunning = false;
    let isExtraTime = false;
    
    // ======= VARIABLES ESP32 =======
    const ESP32_IP = "192.168.0.105"; // ← ¡CAMBIAR ESTA LÍNEA!
let esp32Connected = false;
let buttonCheckInterval;
    
    const ESP32_IP = "192.168.0.105"; // TU IP
    let esp32Connected = false;
    let buttonCheckInterval;
    
    // ======= INICIALIZACIÓN =======
    updateDisplay();
    setupUI();
    
    // Esperar 3 segundos antes de conectar ESP32
    setTimeout(initESP32, 3000);
    
    // ======= EVENT LISTENERS =======
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isRunning) return;
            selectTimeButton(this);
        });
    });
    
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // ======= FUNCIONES CRONÓMETRO =======
    function selectTimeButton(button) {
        timeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedTime = parseInt(button.getAttribute('data-time'));
        mainTimeLeft = selectedTime * 60;
        isExtraTime = false;
        updateDisplay();
    }
    
    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        timerInterval = setInterval(() => {
            if (isExtraTime) {
                if (secondaryTimeLeft > 0) {
                    secondaryTimeLeft--;
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    isExtraTime = false;
                    resetTimerState();
                }
            } else {
                if (mainTimeLeft > 0) {
                    mainTimeLeft--;
                } else {
                    activateExtraTime();
                }
            }
            updateDisplay();
        }, 1000);
    }
    
    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        isExtraTime = false;
        mainTimeLeft = selectedTime * 60;
        secondaryTimeLeft = 30;
        resetTimerState();
        updateDisplay();
    }
    
    function resetTimerState() {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
        secondaryTimer.classList.remove('timer-danger');
    }
    
    function activateExtraTime() {
        isExtraTime = true;
        secondaryTimeLeft = 30;
        updateDisplay();
        
        if (timerInterval) clearInterval(timerInterval);
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timerInterval = setInterval(() => {
            if (secondaryTimeLeft > 0) {
                secondaryTimeLeft--;
                if (secondaryTimeLeft <= 5) {
                    secondaryTimer.classList.add('timer-danger');
                }
            } else {
                clearInterval(timerInterval);
                isRunning = false;
                isExtraTime = false;
                secondaryTimer.classList.remove('timer-danger');
                mainTimeLeft = selectedTime * 60;
                secondaryTimeLeft = 30;
                updateDisplay();
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
            updateDisplay();
        }, 1000);
    }
    
    function updateDisplay() {
        if (isExtraTime) {
            mainTimer.textContent = "00:00";
            secondaryTimer.textContent = `+${secondaryTimeLeft.toString().padStart(2, '0')}`;
        } else {
            const minutes = Math.floor(mainTimeLeft / 60);
            const seconds = mainTimeLeft % 60;
            mainTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            secondaryTimer.textContent = "+30";
        }
    }
    
    // ======= FUNCIONES ESP32 =======
    function initESP32() {
        console.log('🔌 Iniciando conexión ESP32...');
        updateESP32Status('🔄 Conectando...', '#f39c12');
        
        // Usar JSONP para evitar problemas CORS
        testESP32Connection();
        
        // Probar cada 10 segundos
        setInterval(testESP32Connection, 10000);
        
        // Verificar botón cada 2 segundos
        buttonCheckInterval = setInterval(checkESP32Button, 2000);
    }
    
    function testESP32Connection() {
        // Crear script para JSONP (evita CORS)
        const scriptId = 'esp32-jsonp-' + Date.now();
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `http://${ESP32_IP}/status?callback=handleESP32Response`;
        
        // Timeout de 3 segundos
        const timeout = setTimeout(() => {
            document.getElementById(scriptId)?.remove();
            if (!esp32Connected) {
                updateESP32Status('❌ Timeout', '#e74c3c');
            }
        }, 3000);
        
        // Definir callback global
        window.handleESP32Response = function(data) {
            clearTimeout(timeout);
            document.getElementById(scriptId)?.remove();
            
            esp32Connected = true;
            updateESP32Status('✅ Conectado', '#27ae60');
            console.log('ESP32:', data);
        };
        
        document.body.appendChild(script);
    }
    
    function checkESP32Button() {
        if (!esp32Connected) return;
        
        // Usar imagen para hacer ping (método simple)
        const img = new Image();
        img.onload = function() {
            // Si la imagen carga, el ESP32 está activo
            checkButtonStatus();
        };
        img.onerror = function() {
            // Error = ESP32 no disponible
            esp32Connected = false;
            updateESP32Status('❌ Desconectado', '#e74c3c');
        };
        img.src = `http://${ESP32_IP}/button?t=${Date.now()}`;
    }
    
    function checkButtonStatus() {
        fetch(`https://cors-anywhere.herokuapp.com/http://${ESP32_IP}/button`)
            .then(response => response.json())
            .then(data => {
                if (data.pressed === true) {
                    console.log('🔄 Botón físico detectado!');
                    handlePhysicalButton();
                }
            })
            .catch(error => {
                console.log('Error botón:', error);
            });
    }
    
    function handlePhysicalButton() {
        // Mostrar notificación
        showNotification('Botón físico presionado');
        
        // Acción en el temporizador
        if (isRunning) {
            pauseTimer();
            if (!isExtraTime) {
                activateExtraTime();
            }
        } else {
            activateExtraTime();
        }
    }
    
    // ======= FUNCIONES UI =======
    function setupUI() {
        // Crear contenedor ESP32
        const container = document.createElement('div');
        container.id = 'esp32-ui';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial;
            z-index: 1000;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        container.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">🌐 Estado ESP32</div>
            <div id="esp32-status-text" style="margin-bottom: 5px;">🔄 Conectando...</div>
            <div id="esp32-ip" style="font-size: 12px; opacity: 0.8;">IP: ${ESP32_IP}</div>
            <div id="esp32-action" style="margin-top: 10px; font-size: 12px; display: none;">
                Última acción: <span id="last-action">-</span>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Botón de prueba
        const testBtn = document.createElement('button');
        testBtn.textContent = '🔘 Probar Botón';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 12px 20px;
            background: #9b59b6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        `;
        testBtn.onclick = handlePhysicalButton;
        document.body.appendChild(testBtn);
    }
    
    function updateESP32Status(text, color = '#2c3e50') {
        const statusEl = document.getElementById('esp32-status-text');
        const container = document.getElementById('esp32-ui');
        
        if (statusEl) {
            statusEl.textContent = text;
        }
        if (container) {
            container.style.background = color;
        }
    }
    
    function showNotification(message) {
        const actionEl = document.getElementById('esp32-action');
        const lastAction = document.getElementById('last-action');
        
        if (actionEl && lastAction) {
            lastAction.textContent = new Date().toLocaleTimeString();
            actionEl.style.display = 'block';
            
            // Ocultar después de 3 segundos
            setTimeout(() => {
                actionEl.style.display = 'none';
            }, 3000);
        }
        
        // Notificación temporal
        const notification = document.createElement('div');
        notification.textContent = '🔔 ' + message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 2000;
            animation: slideIn 0.5s;
            font-weight: bold;
        `;
        
        // Agregar animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
    
    // ======= INICIALIZACIÓN FINAL =======
    // Activar primer botón de tiempo
    if (timeButtons.length > 0) {
        timeButtons[0].classList.add('active');
    }
    
    console.log('✅ Aplicación lista');
    console.log('📡 ESP32 IP:', ESP32_IP);
});
