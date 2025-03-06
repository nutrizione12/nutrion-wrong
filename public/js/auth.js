import { supabase } from "./supabase-client.js";

window.showLogin = () => {
  document.getElementById("registerContainer").style.display = "none";
  document.getElementById("loginContainer").style.display = "block";
};

window.showRegister = () => {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("registerContainer").style.display = "block";
};

document.addEventListener("DOMContentLoaded", async () => {
  // Verifica sessione attiva con Supabase
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (session && !error) {
    // Verifica effettiva esistenza piano alimentare
    const { data: mealData } = await supabase
      .from("meal_plans")
      .select("plan_data")
      .eq("user_id", session.user.id)
      .maybeSingle();

    localStorage.setItem("accessToken", session.access_token);
    localStorage.setItem("userId", session.user.id);

    if (mealData?.plan_data) {
      localStorage.setItem("mealPlan", JSON.stringify(mealData.plan_data));
      window.location.href = "/dashboard.html";
    } else {
      window.location.href = "/index.html";
    }
  } else {
    // Forza pulizia se sessione non valida
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("mealPlan");
  }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    localStorage.setItem("accessToken", data.session.access_token);
    localStorage.setItem("userId", data.user.id);

    const { data: mealData } = await supabase
      .from("meal_plans")
      .select("plan_data")
      .eq("user_id", data.user.id)
      .single();

    if (mealData)
      localStorage.setItem("mealPlan", JSON.stringify(mealData.plan_data));
    window.location.href = mealData ? "/dashboard.html" : "/index.html";
  } catch (err) {
    alert(`Errore login: ${err.message}`);
  }
});

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert("Registrazione completata! Verifica la tua email.");
      showLogin();
    } catch (err) {
      alert(`Errore registrazione: ${err.message}`);
    }
  });
