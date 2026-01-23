function getHumidityStatus(humidity) {
    if (humidity < 30) {
        return { text: "Ar muito seco", color: "#fbc02d" };
    } else if (humidity <= 40) {
        return { text: "Ar seco", color: "#ff9800" };
    } else if (humidity <= 60) {
        return { text: "Confortável", color: "#4caf50" };
    } else if (humidity <= 80) {
        return { text: "Ar úmido", color: "#03a9f4" };
    } else {
        return { text: "Muito úmido", color: "#e53935" };
    }
}
