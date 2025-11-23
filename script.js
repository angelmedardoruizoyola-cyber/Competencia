document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const mainTimer = document.getElementById('mainTimer');
    const secondaryTimer = document.getElementById('secondaryTimer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const timeButtons = document.querySelectorAll('.time-btn');
    const notificationSound = document.getElementById('notificationSound');

    // Elementos multimedia
    const loadWebBtn = document.getElementById('loadWebBtn');
    const loadVideoBtn = document.getElementById('loadVideoBtn');
    const videoFile = document.getElementById('videoFile');
    const webUrl = document.getElementById('webUrl');
    const webFrame = document.getElementById('webFrame');
    const videoPlayer = document.getElementById('videoPlayer');
    const placeholder = document.getElementById('placeholder');

    // Variables del cronómetro
    let selectedTime = 25; // minutos por defecto
    let mainTimeLeft = selectedTime * 60; // en segundos
    let secondaryTimeLeft = 30; // 30 segundos adicionales
    let timerInterval;
    let isRunning = false;
    let tenMinuteWarningPlayed = false;
    let fiveMinuteWarningPlayed = false;

    // Inicializar
    updateDisplay();

    // Event listeners para botones de tiempo
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isRunning) return; // No permitir cambiar tiempo mientras está corriendo

            // Remover clase active de todos los botones
            timeButtons.forEach(btn => btn.classList.remove('active'));

            // Agregar clase active al botón seleccionado
            this.classList.add('active');

            // Actualizar tiempo seleccionado
            selectedTime = parseInt(this.getAttribute('data-time'));
            mainTimeLeft = selectedTime * 60;
            resetWarnings();
            updateDisplay();
        });
    });

    // Event listeners para controles del cronómetro
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // Event listeners para controles multimedia
    loadWebBtn.addEventListener('click', function() {
        // Mostrar campo de URL
        if (webUrl.style.display === 'none') {
            webUrl.style.display = 'block';
            webUrl.focus();
        } else {
            loadWebContent();
        }
    });

    loadVideoBtn.addEventListener('click', function() {
        videoFile.click();
    });

    videoFile.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            loadVideo(url);
        }
    });

    webUrl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadWebContent();
        }
    });

    // Funciones del cronómetro
    function startTimer() {
        if (isRunning) return;

        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;

        timerInterval = setInterval(() => {
            // Actualizar tiempos
            if (secondaryTimeLeft > 0) {
                secondaryTimeLeft--;
            } else {
                if (mainTimeLeft > 0) {
                    mainTimeLeft--;
                    secondaryTimeLeft = 30; // Reiniciar los 30 segundos adicionales
                } else {
                    // Tiempo completado
                    clearInterval(timerInterval);
                    isRunning = false;
                    playNotification("¡Tiempo completado!");
                    return;
                }
            }

            // Verificar alertas
            checkAlerts();

            // Actualizar pantalla
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
        mainTimeLeft = selectedTime * 60;
        secondaryTimeLeft = 30;
        resetWarnings();
        updateDisplay();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;

        // Restablecer colores
        mainTimer.classList.remove('timer-warning', 'timer-danger');
        mainTimer.classList.add('timer-normal');
    }

    function updateDisplay() {
        // Actualizar cronómetro principal
        const mainMinutes = Math.floor(mainTimeLeft / 60);
        const mainSeconds = mainTimeLeft % 60;
        mainTimer.textContent = `${mainMinutes.toString().padStart(2, '0')}:${mainSeconds.toString().padStart(2, '0')}`;

        // Actualizar cronómetro secundario
        secondaryTimer.textContent = `+${secondaryTimeLeft.toString().padStart(2, '0')}`;
    }

    function checkAlerts() {
        const totalSecondsLeft = mainTimeLeft + secondaryTimeLeft;

        // Alerta de 10 minutos (600 segundos)
        if (totalSecondsLeft === 600 && !tenMinuteWarningPlayed) {
            playNotification("Faltan 10 minutos para terminar el reto");
            mainTimer.classList.remove('timer-normal');
            mainTimer.classList.add('timer-warning');
            tenMinuteWarningPlayed = true;
        }

        // Alerta de 5 minutos (300 segundos)
        if (totalSecondsLeft === 300 && !fiveMinuteWarningPlayed) {
            playNotification("Faltan 5 minutos para terminar el reto");
            mainTimer.classList.remove('timer-warning');
            mainTimer.classList.add('timer-danger');
            fiveMinuteWarningPlayed = true;
        }

        // Cuenta regresiva de 10 segundos
        if (totalSecondsLeft <= 10 && totalSecondsLeft > 0) {
            playNotification(`${totalSecondsLeft}`);
        }
    }

    function resetWarnings() {
        tenMinuteWarningPlayed = false;
        fiveMinuteWarningPlayed = false;
    }

    function playNotification(message) {
        // Usar síntesis de voz si está disponible
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'es-ES';
            utterance.rate = 1;
            speechSynthesis.speak(utterance);
        }

        // Reproducir sonido de notificación
        if (notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(e => console.log("No se pudo reproducir el sonido:", e));
        }

        // Mostrar notificación en consola
        console.log(`Notificación: ${message}`);
    }

    // Funciones multimedia
    function loadWebContent() {
        const url = webUrl.value.trim();
        if (!url) {
            alert('Por favor, ingresa una URL válida');
            return;
        }

        // Ocultar otros elementos multimedia
        videoPlayer.style.display = 'none';
        placeholder.style.display = 'none';

        // Mostrar iframe
        webFrame.src = url;
        webFrame.style.display = 'block';

        // Ocultar campo de URL
        webUrl.style.display = 'none';
        webUrl.value = '';
    }

    function loadVideo(url) {
        // Ocultar otros elementos multimedia
        webFrame.style.display = 'none';
        placeholder.style.display = 'none';

        // Configurar y mostrar video
        videoPlayer.src = url;
        videoPlayer.loop = true;
        videoPlayer.style.display = 'block';
        videoPlayer.play().catch(e => console.log("No se pudo reproducir el video automáticamente:", e));
    }

    // Establecer el botón de 25 minutos como activo por defecto
    document.querySelector('.time-btn[data-time="25"]').classList.add('active');
});
