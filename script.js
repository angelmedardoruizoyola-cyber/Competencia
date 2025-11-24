document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const mainTimer = document.getElementById('mainTimer');
    const secondaryTimer = document.getElementById('secondaryTimer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const timeButtons = document.querySelectorAll('.time-btn');

    // Elementos multimedia
    const loadImageBtn = document.getElementById('loadImageBtn');
    const loadVideoBtn = document.getElementById('loadVideoBtn');
    const imageFile = document.getElementById('imageFile');
    const videoFile = document.getElementById('videoFile');
    const imagePlayer = document.getElementById('imagePlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const placeholder = document.getElementById('placeholder');

    // Variables del cronómetro
    let selectedTime = 25; // minutos por defecto
    let mainTimeLeft = selectedTime * 60; // en segundos
    let secondaryTimeLeft = 30; // 30 segundos adicionales
    let timerInterval;
    let isRunning = false;
    let isExtraTime = false; // Controla si estamos en tiempo adicional
    let tenMinuteWarningPlayed = false;
    let fiveMinuteWarningPlayed = false;
    let countdownPlayed = false; // Para controlar la cuenta regresiva

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
            isExtraTime = false;
            resetWarnings();
            updateDisplay();
        });
    });

    // Event listeners para controles del cronómetro
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // Event listeners para controles multimedia
    loadImageBtn.addEventListener('click', function() {
        imageFile.click();
    });

    loadVideoBtn.addEventListener('click', function() {
        videoFile.click();
    });

    imageFile.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                showError('Por favor, selecciona un archivo de imagen válido');
                return;
            }

            const url = URL.createObjectURL(file);
            loadImage(url);
        }
    });

    videoFile.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validar que sea un video
            if (!file.type.startsWith('video/')) {
                showError('Por favor, selecciona un archivo de video válido');
                return;
            }

            const url = URL.createObjectURL(file);
            loadVideo(url);
        }
    });

    // Funciones del cronómetro
    function startTimer() {
        if (isRunning) return;

        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        countdownPlayed = false; // Resetear cuenta regresiva

        timerInterval = setInterval(() => {
            // Si estamos en tiempo adicional (30 segundos extra)
            if (isExtraTime) {
                if (secondaryTimeLeft > 0) {
                    secondaryTimeLeft--;

                    // Cuenta regresiva de 5 segundos en tiempo adicional
                    if (secondaryTimeLeft <= 5 && secondaryTimeLeft > 0) {
                        playNotification(`${secondaryTimeLeft}`);

                        // Cambiar color del cronómetro secundario
                        secondaryTimer.classList.add('secondary-timer-warning');
                    }
                } else {
                    // Tiempo completamente terminado
                    clearInterval(timerInterval);
                    isRunning = false;
                    playNotification("fin-juego");

                    // Restablecer colores
                    secondaryTimer.classList.remove('secondary-timer-warning');
                    return;
                }
            }
            // Si estamos en tiempo principal
            else {
                if (mainTimeLeft > 0) {
                    mainTimeLeft--;

                    // Verificar alertas durante el tiempo principal
                    checkAlerts();
                } else {
                    // Tiempo principal terminado, iniciar tiempo adicional
                    isExtraTime = true;
                    secondaryTimeLeft = 30; // 30 segundos adicionales
                    playNotification("tiempo-adicional");

                    // Cambiar el estilo para indicar tiempo adicional
                    mainTimer.textContent = "00:00";
                    mainTimer.classList.remove('timer-warning', 'timer-danger');
                    mainTimer.classList.add('timer-normal');
                }
            }

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
        isExtraTime = false;
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
        secondaryTimer.classList.remove('secondary-timer-warning');
    }

    function updateDisplay() {
        if (isExtraTime) {
            // En tiempo adicional: mostrar 00:00 + 30 segundos contando
            mainTimer.textContent = "00:00";
            secondaryTimer.textContent = `+${secondaryTimeLeft.toString().padStart(2, '0')}`;
        } else {
            // En tiempo normal: mostrar tiempo principal + 30 segundos fijos
            const mainMinutes = Math.floor(mainTimeLeft / 60);
            const mainSeconds = mainTimeLeft % 60;
            mainTimer.textContent = `${mainMinutes.toString().padStart(2, '0')}:${mainSeconds.toString().padStart(2, '0')}`;
            secondaryTimer.textContent = "+30";
        }
    }

    function checkAlerts() {
        // Solo verificar alertas durante el tiempo principal
        if (isExtraTime) return;

        const totalSecondsLeft = mainTimeLeft;

        // Alerta de 10 minutos (600 segundos)
        if (totalSecondsLeft === 600 && !tenMinuteWarningPlayed) {
            playNotification("10-minutos");
            mainTimer.classList.remove('timer-normal');
            mainTimer.classList.add('timer-warning');
            tenMinuteWarningPlayed = true;
        }

        // Alerta de 5 minutos (300 segundos)
        if (totalSecondsLeft === 300 && !fiveMinuteWarningPlayed) {
            playNotification("5-minutos");
            mainTimer.classList.remove('timer-warning');
            mainTimer.classList.add('timer-danger');
            fiveMinuteWarningPlayed = true;
        }

        // Cuenta regresiva de 5 segundos (solo en tiempo principal)
        if (totalSecondsLeft <= 5 && totalSecondsLeft > 0 && !countdownPlayed) {
            playNotification(`${totalSecondsLeft}`);
            if (totalSecondsLeft === 1) {
                countdownPlayed = true;
            }
        }
    }

    function resetWarnings() {
        tenMinuteWarningPlayed = false;
        fiveMinuteWarningPlayed = false;
        countdownPlayed = false;
    }

    function playNotification(message) {
        // Mapeo de mensajes a archivos de audio específicos
        const audioMap = {
            "10-minutos": "sounds/10-minutos.mp3",
            "5-minutos": "sounds/5-minutos.mp3",
            "tiempo-adicional": "sounds/tiempo-adicional.mp3",
            "fin-juego": "sounds/fin-juego.mp3",
            "5": "sounds/5.mp3",
            "4": "sounds/4.mp3",
            "3": "sounds/3.mp3",
            "2": "sounds/2.mp3",
            "1": "sounds/1.mp3",
            "0": "sounds/0.mp3"
        };

        // Reproducir audio específico si existe
        const audioFile = audioMap[message];
        if (audioFile) {
            const audio = new Audio(audioFile);
            audio.play().catch(e => console.log("No se pudo reproducir el audio:", e));
        }

        // También usar síntesis de voz como respaldo
        if ('speechSynthesis' in window) {
            let textToSpeak = message;

            // Convertir códigos a texto para síntesis de voz
            const textMap = {
                "10-minutos": "Faltan 10 minutos para terminar el reto",
                "5-minutos": "Faltan 5 minutos para terminar el reto",
                "tiempo-adicional": "Tiempo principal terminado. Iniciando 30 segundos adicionales",
                "fin-juego": "Fin del juego"
            };

            textToSpeak = textMap[message] || message;

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'es-ES';
            utterance.rate = 1;
            speechSynthesis.speak(utterance);
        }

        console.log(`Notificación: ${message}`);
    }

    // Funciones multimedia
    function loadImage(url) {
        try {
            // Ocultar otros elementos multimedia
            videoPlayer.style.display = 'none';
            videoPlayer.src = '';
            placeholder.style.display = 'none';

            // Mostrar mensaje de carga
            placeholder.style.display = 'flex';
            placeholder.innerHTML = '<p class="loading-message">Cargando imagen...</p>';

            // Configurar y mostrar imagen
            imagePlayer.src = url;
            imagePlayer.style.display = 'block';

            // Manejar carga exitosa
            imagePlayer.onload = function() {
                placeholder.style.display = 'none';
            };

            // Manejar errores
            imagePlayer.onerror = function() {
                showError('Error: No se pudo cargar la imagen');
                imagePlayer.style.display = 'none';
            };

        } catch (error) {
            showError('Error: No se pudo cargar la imagen');
            console.error('Error cargando imagen:', error);
        }
    }

    function loadVideo(url) {
        try {
            // Ocultar otros elementos multimedia
            imagePlayer.style.display = 'none';
            imagePlayer.src = '';
            placeholder.style.display = 'none';

            // Configurar y mostrar video
            videoPlayer.src = url;
            videoPlayer.loop = true;
            videoPlayer.controls = true;
            videoPlayer.style.display = 'block';

            // Intentar reproducir automáticamente
            videoPlayer.play().catch(e => {
                console.log("No se pudo reproducir el video automáticamente:", e);
                // El usuario podrá reproducirlo manualmente con los controles
            });

        } catch (error) {
            showError('Error: No se pudo cargar el video');
            console.error('Error cargando video:', error);
        }
    }

    function showError(message) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `<p class="error-message">${message}</p>`;
    }

    // Establecer el botón de 25 minutos como activo por defecto
    document.querySelector('.time-btn[data-time="25"]').classList.add('active');
});
