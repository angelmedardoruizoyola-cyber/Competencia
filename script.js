
// script.js - VERSIÓN CON PROXY CORS PARA GITHUB PAGES
document.addEventListener('DOMContentLoaded', function() {
    // ======= ELEMENTOS DEL DOM =======
    const mainTimer = document.getElementById('mainTimer');
    const secondaryTimer = document.getElementById('secondaryTimer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const timeButtons = document.querySelectorAll('.time-btn');

    // ======= VARIABLES =======
    let selectedTime = 25;
    let mainTimeLeft = selectedTime * 60;
    let secondaryTimeLeft = 30;
    let timerInterval;
    let isRunning = false;
    let isExtraTime = false;

    // ======= CONFIGURACIÓN ESP32 =======
    const ESP32_IP = "192.168.0.105"; // Tu ESP32
    let esp32Connected = false;
    let checkingESP32 = false;

    // ======= INICIALIZACIÓN =======
    updateDisplay();
    setupESP32UI();
    
    // Iniciar conexión después de 2 segundos
    setTimeout(initESP32Connection, 2000);

    // ======= EVENT LISTENERS =======
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isRunning) return;
            timeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedTime = parseInt(this.getAttribute('data-time'));
            mainTimeLeft = selectedTime * 60;
            isExtraTime = false;
            updateDisplay();
        });
    });

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // ======= FUNCIONES DEL CRONÓMETRO =======
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
                    if (secondaryTimeLeft <= 5) {
                        // Efecto visual para últimos segundos
                        secondaryTimer.classList.add('timer-danger');
                    }
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    isExtraTime = false;
                    secondaryTimer.classList.remove('timer-danger');
                }
            } else {
                if (mainTimeLeft > 0) {
                    mainTimeLeft--;
                } else {
                    isExtraTime = true;
                    secondaryTimeLeft = 30;
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
        updateDisplay();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
        secondaryTimer.classList.remove('timer-danger');
    }

    function updateDisplay() {
        if (isExtraTime) {
            mainTimer.textContent = "00:00";
            secondaryTimer.textContent = `+${secondaryTimeLeft.toString().padStart(2, '0')}`;
        } else {
            const mainMinutes = Math.floor(mainTimeLeft / 60);
            const mainSeconds = mainTimeLeft % 60;
            mainTimer.textContent = `${mainMinutes.toString().padStart(2, '0')}:${mainSeconds.toString().padStart(2, '0')}`;
            secondaryTimer.textContent = "+30";
        }
    }

    // ======= FUNCIONES ESP32 (CON PROXY) =======
    function initESP32Connection() {
        console.log('🔌 Iniciando conexión ESP32...');
        
        // Probar conexión inmediatamente
        testESP32Connection();
        
        // Probar cada 5 segundos
        setInterval(testESP32Connection, 5000);
        
        // Verificar botón cada 1 segundo
        setInterval(checkESP32Button, 1000);
    }

    function testESP32Connection() {
        if (checkingESP32) return;
        checkingESP32 = true;
        
        // Usar proxy CORS para GitHub Pages
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`http://${ESP32_IP}/status`)}`;
        
        fetch(proxyUrl)
            .then(response => response.json())
            .then(data => {
                try {
                    const esp32Data = JSON.parse(data.contents);
                    if (!esp32Connected) {
                        esp32Connected = true;
                        updateESP32Status();
                        console.log('✅ ESP32 conectado:', esp32Data);
                        showNotification('ESP32 conectado', 'success');
                    }
                } catch (e) {
                    if (esp32Connected) {
                        esp32Connected = false;
                        updateESP32Status();
                    }
                }
            })
            .catch(error => {
                if (esp32Connected) {
                    esp32Connected = false;
                    updateESP32Status();
                    console.log('❌ Error conectando ESP32:', error);
                }
            })
            .finally(() => {
                checkingESP32 = false;
            });
    }

    function checkESP32Button() {
        if (!esp32Connected || checkingESP32) return;
        checkingESP32 = true;
        
        // Usar proxy para evitar problemas CORS
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`http://${ESP32_IP}/button-status`)}`;
        
        fetch(proxyUrl)
            .then(response => response.json())
            .then(data => {
                try {
                    const buttonData = JSON.parse(data.contents);
                    if (buttonData.button_pressed === true) {
                        console.log('🔄 Botón físico detectado!');
                        handlePhysicalButtonPress();
                    }
                } catch (e) {
                    console.log('Error parseando respuesta ESP32');
                }
            })
            .catch(error => {
                console.log('Error consultando botón ESP32');
            })
            .finally(() => {
                checkingESP32 = false;
            });
    }

    function handlePhysicalButtonPress() {
        console.log('🎯 Ejecutando acción del botón físico');
        
        // Mostrar notificación visual
        showButtonNotification();
        
        // Acción 1: Si el temporizador está corriendo, pausarlo
        if (isRunning) {
            pauseTimer();
            
            // Acción 2: Activar 30 segundos adicionales si no está en tiempo extra
            if (!isExtraTime) {
                activateExtraTime();
            }
        } else {
            // Si no está corriendo, iniciar tiempo adicional
            activateExtraTime();
        }
    }

    function activateExtraTime() {
        isExtraTime = true;
        secondaryTimeLeft = 30;
        updateDisplay();
        
        // Iniciar cuenta regresiva automática
        if (timerInterval) clearInterval(timerInterval);
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        timerInterval = setInterval(() => {
            if (secondaryTimeLeft > 0) {
                secondaryTimeLeft--;
                
                // Efecto visual últimos 5 segundos
                if (secondaryTimeLeft <= 5) {
                    secondaryTimer.classList.add('timer-danger');
                }
            } else {
                // Tiempo adicional terminado
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

    function setupESP32UI() {
        // Contenedor principal
        const container = document.createElement('div');
        container.id = 'esp32-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        `;
        
        // Estado de conexión
        const statusDiv = document.createElement('div');
        statusDiv.id = 'esp32-status';
        statusDiv.style.cssText = `
            padding: 10px 15px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            background: #e74c3c;
            color: white;
            border: 2px solid #c0392b;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            transition: all 0.3s;
            min-width: 180px;
            text-align: center;
        `;
        statusDiv.textContent = '🔄 Conectando ESP32...';
        
        // Última acción
        const actionDiv = document.createElement('div');
        actionDiv.id = 'esp32-action';
        actionDiv.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            background: rgba(52, 152, 219, 0.9);
            color: white;
            display: none;
            min-width: 180px;
            text-align: center;
        `;
        
        container.appendChild(statusDiv);
        container.appendChild(actionDiv);
        document.body.appendChild(container);
        
        // Botón de prueba para desarrollo
        const testBtn = document.createElement('button');
        testBtn.id = 'esp32-test-btn';
        testBtn.textContent = '🔘 Simular Botón Físico';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            padding: 10px 15px;
            background: #9b59b6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            z-index: 1000;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 3px 8px rgba(0,0,0,0.2);
            transition: all 0.2s;
        `;
        testBtn.onmouseover = () => testBtn.style.background = '#8e44ad';
        testBtn.onmouseout = () => testBtn.style.background = '#9b59b6';
        testBtn.onclick = () => {
            console.log('🧪 Simulando botón físico');
            handlePhysicalButtonPress();
        };
        document.body.appendChild(testBtn);
    }

    function updateESP32Status() {
        const statusDiv = document.getElementById('esp32-status');
        if (statusDiv) {
            if (esp32Connected) {
                statusDiv.textContent = '✅ ESP32 Conectado';
                statusDiv.style.background = '#27ae60';
                statusDiv.style.borderColor = '#219653';
            } else {
                statusDiv.textContent = '❌ ESP32 Desconectado';
                statusDiv.style.background = '#e74c3c';
                statusDiv.style.borderColor = '#c0392b';
            }
        }
    }

    function showButtonNotification() {
        const actionDiv = document.getElementById('esp32-action');
        if (actionDiv) {
            actionDiv.textContent = '🔄 Botón físico activado';
            actionDiv.style.display = 'block';
            
            // Ocultar después de 2 segundos
            setTimeout(() => {
                actionDiv.style.display = 'none';
            }, 2000);
        }
        
        // También mostrar notificación flotante
        showNotification('Botón físico detectado', 'info');
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 2000;
            animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.5s forwards;
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        // Colores según tipo
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #27ae60, #219653)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        }
        
        // Agregar estilos de animación
        const styleId = 'notification-animations';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
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
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // ======= INICIALIZACIÓN FINAL =======
    // Activar botón de 25 minutos por defecto
    const defaultBtn = document.querySelector('.time-btn[data-time="25"]');
    if (defaultBtn) defaultBtn.classList.add('active');
    
    console.log('✅ Página cargada - ESP32 Integration activa');
    console.log('📡 ESP32 IP:', ESP32_IP);
});
