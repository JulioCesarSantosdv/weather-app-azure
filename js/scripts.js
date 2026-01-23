document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("get-weather");
    const cityInput = document.getElementById("city-input");
    const resultDiv = document.getElementById("weather-result");
    const bgVideo = document.getElementById("bg-video");

    async function buscarClima() {
        const city = cityInput.value.trim();

        if (!city) {
            resultDiv.style.display = "block";
            resultDiv.textContent = "Por favor, digite o nome de uma cidade.";
            return;
        }

        resultDiv.style.display = "block";
        resultDiv.textContent = "Buscando dados do clima...";

        try {
            //  Busca cidade, país e estado 
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                city
            )}&count=1&language=pt&format=json`;

            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                resultDiv.textContent = "Cidade não encontrada.";
                return;
            }

            // Extraindo 'admin1' que geralmente contém o estado/província
            const { latitude, longitude, name, country, admin1 } = geoData.results[0];
            const locationDisplay = admin1 ? `${name}, ${admin1} - ${country}` : `${name}, ${country}`;

            //  Clima
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;

            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();

            const weather = weatherData.current_weather;
            const code = weather.weathercode;

            // ===============================
            //  Fallback inteligente de umidade
            // ===============================
            let humidity = null;
            let index = weatherData.hourly.time.indexOf(weather.time);

            if (index === -1) {
                const currentTime = new Date(weather.time).getTime();
                index = weatherData.hourly.time.reduce(
                    (closest, time, i) => {
                        const diff = Math.abs(new Date(time).getTime() - currentTime);
                        return diff < closest.diff ? { diff, index: i } : closest;
                    },
                    { diff: Infinity, index: 0 }
                ).index;
            }

            if (weatherData.hourly.relativehumidity_2m[index] !== undefined) {
                humidity = weatherData.hourly.relativehumidity_2m[index];
            } else {
                const values = weatherData.hourly.relativehumidity_2m;
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                humidity = Math.round(avg);
            }

            humidity = Math.round(humidity);
            if (isNaN(humidity)) humidity = 0;

            const humidityStatus = getHumidityStatus(humidity);

            //  Resultado atualizado com Estado
            resultDiv.innerHTML = `
                <strong>${locationDisplay}</strong><br>
                🌡️ Temperatura: ${weather.temperature} °C<br>
                💨 Vento: ${weather.windspeed} km/h<br>
                💧 Umidade do ar: ${humidity}%<br>
                <span style="
                    margin-top: 8px;
                    display: inline-block;
                    color: ${humidityStatus.color};
                    font-weight: 600;
                ">
                    ${humidityStatus.text}
                </span>
            `;

            // Troca de vídeo baseada no weather code (WMO Weather interpretation codes)
            let videoSrc = "video/default.mp4";

            // Mapeamento mais abrangente dos códigos WMO
            if (code === 0) {
                videoSrc = "video/clear.mp4"; // Céu limpo
            } else if ([1, 2, 3].includes(code)) {
                videoSrc = "video/clouds.mp4"; // Parcialmente nublado / Nublado
            } else if ([45, 48].includes(code)) {
                videoSrc = "video/clouds.mp4"; // Nevoeiro (usando nuvens como fallback)
            } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
                videoSrc = "video/rain.mp4"; // Chuva / Chuvisco
            } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
                videoSrc = "video/snow.mp4"; // Neve
            } else if ([95, 96, 99].includes(code)) {
                videoSrc = "video/rain.mp4"; // Tempestade (usando chuva como fallback)
            }

            // Atualiza vídeo corretamente
            // IMPORTANTE: Para mudar o vídeo, alteramos o 'src' do elemento video diretamente 
            // ou recarregamos após mudar o source.
            if (!bgVideo.src.includes(videoSrc)) {
                bgVideo.src = videoSrc;
                bgVideo.load();
                bgVideo.play().catch(e => console.log("Autoplay bloqueado ou erro ao dar play:", e));
            }
        } catch (error) {
            console.error("Erro ao buscar clima:", error);
            resultDiv.textContent = "Erro ao buscar dados do clima.";
        }
    }

    button.addEventListener("click", buscarClima);

    cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            buscarClima();
        }
    });
});
