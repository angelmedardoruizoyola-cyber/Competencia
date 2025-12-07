// script.js - VERSIÓN SIMPLIFICADA PARA GITHUB PAGES
document.addEventListener('DOMContentLoaded', function() {
    // ======= ELEMENTOS DEL DOM =======
    const mainTimer = document.getElementById('mainTimer');
    const secondaryTimer = document.getElementById('secondaryTimer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const timeButtons = document.querySelectorAll('.time-btn');

    // ======= VARIABLES DEL CRONÓMETRO =======
    let selectedTime = 25;
    let mainTimeLeft = selectedTime * 60;
    let secondaryTimeLeft = 30;
    let timerInterval;
    let isRunning = false;
    let isExtraTime = false;

    // ======= VARIABLES ESP32 =======
    const ESP32_IP = "192.168.0.105"; // TU IP DEL ESP32
    let esp32Connected = false;

    // ======= INICIALIZACIÓN =======
    updateDisplay();
    setupESP32UI();
    initESP32Connection();

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
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
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

    // ======= FUNCIONES ESP32 =======
    function initESP32Connection() {
        console.log('🔌 Conectando con ESP32...');
        checkESP32Status();
        // Verificar cada 5 segundos
        setInterval(checkESP32Status, 5000);
        // Verificar botón cada 1 segundo
        setInterval(checkESP32Button, 1000);
    }

    function checkESP32Status() {
        fetch(`http://${ESP32_IP}/status`, { mode: 'no-cors' })
            .then(() => {
                if (!esp32Connected) {
                    esp32Connected = true;
                    updateESP32Status();
                    console.log('✅ ESP32 conectado');
                }
            })
            .catch(() => {
                if (esp32Connected) {
                    esp32Connected = false;
                    updateESP32Status();
                    console.log('❌ ESP32 desconectado');
                }
            });
    }

    function checkESP32Button() {
        if (!esp32Connected) return;
        
        // Usamos un proxy CORS para GitHub Pages
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`http://${ESP32_IP}/button`)}`;
        
        fetch(proxyUrl)
            .then(response => response.json())
            .then(data => {
                if (data.button_pressed) {
                    handlePhysicalButton();
                }
            })
            .catch(error => console.log('Error checking button:', error));
    }

    function handlePhysicalButton() {
        console.log('🔄 Botón físico presionado en ESP32');
        
        if (isRunning) {
            pauseTimer();
            if (!isExtraTime) {
                isExtraTime = true;
                secondaryTimeLeft = 30;
                updateDisplay();
                startExtraTimeCountdown();
            }
        } else {
            isExtraTime = true;
            secondaryTimeLeft = 30;
            updateDisplay();
            startExtraTimeCountdown();
        }
    }

    function startExtraTimeCountdown() {
        if (timerInterval) clearInterval(timerInterval);
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timerInterval = setInterval(() => {
            if (secondaryTimeLeft > 0) {
                secondaryTimeLeft--;
            } else {
                clearInterval(timerInterval);
                isRunning = false;
                isExtraTime = false;
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
        const statusDiv = document.createElement('div');
        statusDiv.id = 'esp32-status-ui';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 1000;
            background: #f44336;
            color: white;
        `;
        statusDiv.textContent = '❌ ESP32 Desconectado';
        document.body.appendChild(statusDiv);
    }

    function updateESP32Status() {
        const statusDiv = document.getElementById('esp32-status-ui');
        if (statusDiv) {
            if (esp32Connected) {
                statusDiv.textContent = '✅ ESP32 Conectado';
                statusDiv.style.background = '#4CAF50';
            } else {
                statusDiv.textContent = '❌ ESP32 Desconectado';
                statusDiv.style.background = '#f44336';
            }
        }
    }

    // Botón de prueba para desarrollo
    const testBtn = document.createElement('button');
    testBtn.textContent = '🔘 Simular Botón ESP32';
    testBtn.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 20px;
        padding: 8px 12px;
        background: #9b59b6;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        font-size: 12px;
    `;
    testBtn.onclick = handlePhysicalButton;
    document.body.appendChild(testBtn);

    // Inicializar botón de 25 minutos como activo
    document.querySelector('.time-btn[data-time="25"]').classList.add('active');
    
    console.log('✅ Página cargada correctamente');
});
