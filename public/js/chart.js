let weightChartInstance = null;
let nutritionChartInstance = null;

async function initCharts() {
  try {
    // Dati nutrizionali
    const mealPlan = JSON.parse(localStorage.getItem("mealPlan")) || {
      days: [],
    };
    const userId = localStorage.getItem("userId");

    // Distruggi istanze precedenti
    if (nutritionChartInstance) nutritionChartInstance.destroy();
    if (weightChartInstance) weightChartInstance.destroy();

    // Grafico Nutrienti
    if (mealPlan.days.length > 0) {
      const totals = mealPlan.days.reduce(
        (acc, day) => ({
          proteine: acc.proteine + (day.total?.proteine || 0),
          carboidrati: acc.carboidrati + (day.total?.carboidrati || 0),
          grassi: acc.grassi + (day.total?.grassi || 0),
        }),
        { proteine: 0, carboidrati: 0, grassi: 0 },
      );

      nutritionChartInstance = new Chart(
        document.getElementById("nutritionChart"),
        {
          type: "doughnut",
          data: {
            labels: ["Proteine (g)", "Carboidrati (g)", "Grassi (g)"],
            datasets: [
              {
                data: [totals.proteine, totals.carboidrati, totals.grassi],
                backgroundColor: ["#4CAF50", "#2196F3", "#FF9800"],
              },
            ],
          },
        },
      );
    }

    // Grafico Peso
    let weightData = [];
    if (userId) {
      const response = await fetch(`/api/weight-history?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        weightData = Array.isArray(data) ? data : [];
      }
    }

    weightChartInstance = new Chart(document.getElementById("weightChart"), {
      type: "line",
      data: {
        labels: weightData.map((entry) =>
          new Date(entry.created_at).toLocaleDateString("it-IT"),
        ),
        datasets: [
          {
            label: "Peso (kg)",
            data: weightData.map((entry) => entry.weight),
            borderColor: "#4CAF50",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: false,
            suggestedMin:
              Math.min(...weightData.map((entry) => entry.weight)) - 5,
          },
        },
      },
    });
  } catch (error) {
    console.error("Errore inizializzazione grafici:", error);
  }
}

async function logWeight() {
  const weightInput = document.getElementById("currentWeight");
  const weight = parseFloat(weightInput.value);
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("Errore: Utente non riconosciuto. Ricarica la pagina e riprova.");
    return;
  }

  if (!weight || isNaN(weight)) {
    alert("Inserisci un peso valido (es. 70.5)");
    return;
  }

  try {
    const response = await fetch("/api/log-weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, weight }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Errore sconosciuto");
    }

    await initCharts();
    weightInput.value = "";
    alert("Peso registrato con successo!");
  } catch (error) {
    console.error("Errore logWeight:", error);
    alert(`ERRORE: ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", initCharts);
