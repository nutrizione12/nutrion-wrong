  document.addEventListener("DOMContentLoaded", async () => {
    // Verifica sessione valida con Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (!session || error) {
      localStorage.clear();
      window.location.href = '/auth.html';
      return;
    }

    // Controllo coerenza dati
    const path = window.location.pathname;
    const hasMealPlan = localStorage.getItem('mealPlan');

    // Logica di reindirizzamento migliorata
    if (path === '/auth.html' && session) {
      window.location.href = hasMealPlan ? '/dashboard.html' : '/index.html';
      return;
    }

    if ((path === '/index.html' || path === '/') && hasMealPlan) {
      window.location.href = '/dashboard.html';
      return;
    }

    // Inizializza la pagina corrente
    initializePage();
  });

  // Reset flag se non siamo sulla pagina index
  if (!isIndexPage) {
    localStorage.removeItem("generatingNewPlan");
  }

  // Gestione logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("mealPlan");
      window.location.href = "/auth.html";
    });
  }

  // Gestione bottone nuovo piano alimentare
  const newPlanBtn = document.getElementById("newPlanBtn");
  if (newPlanBtn) {
    newPlanBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Imposta un flag per indicare che stiamo generando un nuovo piano
      localStorage.setItem("generatingNewPlan", "true");
      window.location.href = "/index.html";
    });
  }

  // Inizializza interfaccia in base alla pagina
  initializePage();
});

function initializePage() {
  const path = window.location.pathname;

  if (path === '/dashboard.html') {
    initializeDashboard();
  } else if (path === '/calendar.html') {
    initializeCalendar();
  } else if (path === '/index.html' || path === '/') {
    initializeIndex();
  }
}

function initializeIndex() {
    //This function is now largely redundant due to the changes in the DOMContentLoaded listener.  Leaving it empty for now to avoid potential errors.

}

function initializeDashboard() {
  // Ottieni dati del piano alimentare
  const mealPlanData = JSON.parse(localStorage.getItem("mealPlan"));
  if (!mealPlanData) return;

  // Inizializza grafico nutrizione
  initNutritionChart(mealPlanData);

  // Inizializza grafico peso
  initWeightChart();
}

function initializeCalendar() {
  const mealPlanData = JSON.parse(localStorage.getItem("mealPlan"));
  if (!mealPlanData || !mealPlanData.days) return;

  const calendarContainer = document.getElementById("calendarContainer");
  if (!calendarContainer) return;

  // Crea elementi del calendario
  mealPlanData.days.forEach((day, index) => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    dayCard.innerHTML = `
      <h2>Giorno ${index + 1}</h2>
      <div class="meal">
        <h3>Colazione</h3>
        <p>${day.breakfast}</p>
      </div>
      <div class="meal">
        <h3>Pranzo</h3>
        <p>${day.lunch}</p>
      </div>
      <div class="meal">
        <h3>Cena</h3>
        <p>${day.dinner}</p>
      </div>
      <div class="meal">
        <h3>Spuntini</h3>
        <p>${day.snacks.join(", ")}</p>
      </div>
    `;

    calendarContainer.appendChild(dayCard);
  });
}

function initNutritionChart(mealPlanData) {
  if (!mealPlanData || !mealPlanData.nutrition) return;

  const ctx = document.getElementById("nutritionChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Proteine", "Carboidrati", "Grassi"],
      datasets: [
        {
          data: [
            mealPlanData.nutrition.protein,
            mealPlanData.nutrition.carbs,
            mealPlanData.nutrition.fat,
          ],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        },
      ],
    },
  });
}

function initWeightChart() {
  fetchWeightHistory().then((weightData) => {
    const ctx = document.getElementById("weightChart");
    if (!ctx) return;

    new Chart(ctx, {
      type: "line",
      data: {
        labels: weightData.map((entry) => {
          const date = new Date(entry.created_at);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: "Peso (kg)",
            data: weightData.map((entry) => entry.weight),
            borderColor: "#4CAF50",
            tension: 0.1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });
  });
}

async function fetchWeightHistory() {
  try {
    const response = await fetch("/api/weight-history", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) return [];

    return await response.json();
  } catch (error) {
    console.error("Errore nel recupero della storia del peso:", error);
    return [];
  }
}

function logWeight() {
  const weightInput = document.getElementById("currentWeight");
  const weight = parseFloat(weightInput.value);

  if (isNaN(weight) || weight <= 0) {
    alert("Inserisci un peso valido");
    return;
  }

  fetch("/api/log-weight", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ weight }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Errore nel salvare il peso");
      return response.json();
    })
    .then(() => {
      console.log("Peso registrato:", weight);
      weightInput.value = "";
      // Aggiorna il grafico
      initWeightChart();
    })
    .catch((error) => {
      console.error("Errore:", error);
      alert("Si è verificato un errore nel salvare il peso");
    });
}

function showErrorModal(message) {
  alert(message);
}