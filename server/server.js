import express from "express";
import cors from "cors";
import { supabase } from "./supabase-client.js";
import { generateMealPlan } from "./ai-client.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Middleware di autenticazione
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token mancante" });
    }

    // Verifica il token e ottieni l'utente
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error(
        "Errore verifica token:",
        error?.message || "Utente non trovato",
      );
      return res.status(401).json({ error: "Token non valido" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Errore middleware autenticazione:", error);
    res.status(500).json({ error: "Errore interno durante l'autenticazione" });
  }
};

// Endpoint per generare piano alimentare
app.post("/api/generate-meal-plan", authenticate, async (req, res) => {
  try {
    const userData = req.body;

    // Validazione dati
    if (!userData.age || !userData.weight || !userData.goals) {
      return res.status(400).json({ error: "Dati incompleti" });
    }

    // Genera piano alimentare
    const mealPlan = await generateMealPlan(userData);

    // Restituisci piano alimentare
    res.json(mealPlan);
  } catch (error) {
    console.error("Errore generazione piano:", error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware di validazione
const validateQuestionnaire = (req, res, next) => {
  const { userData } = req.body;

  if (
    !userData ||
    typeof userData.age !== "number" ||
    typeof userData.weight !== "number" ||
    !userData.goals
  ) {
    return res
      .status(400)
      .json({ error: "Dati obbligatori mancanti o non validi" });
  }

  req.body.userData = {
    ...userData,
    allergies: Array.isArray(userData.allergies) ? userData.allergies : [],
    preferences: Array.isArray(userData.preferences)
      ? userData.preferences
      : [],
  };

  next();
};

app.post(
  "/api/submit-questionnaire",
  authenticate,
  validateQuestionnaire,
  async (req, res) => {
    try {
      const { userData } = req.body;

      const { data, error } = await supabase
        .from("users")
        .upsert([
          {
            id: req.user.id,
            ...userData,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      const mealPlan = await generateMealPlan(userData);

      const { error: planError } = await supabase.from("meal_plans").insert([
        {
          user_id: req.user.id,
          plan_data: mealPlan,
        },
      ]);

      if (planError) throw planError;

      res.json({
        success: true,
        mealPlan,
        userId: req.user.id,
      });
    } catch (error) {
      console.error("Errore:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

app.post("/api/log-weight", authenticate, async (req, res) => {
  try {
    const { weight } = req.body;

    if (!weight) return res.status(400).json({ error: "Peso mancante" });

    const { data, error } = await supabase
      .from("weight_history")
      .insert([
        {
          user_id: req.user.id,
          weight: parseFloat(weight),
        },
      ])
      .select();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/weight-history", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("weight_history")
      .select("weight, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    res.status(500).json([]);
  }
});

// Endpoint per recuperare il piano alimentare esistente
app.get("/api/get-meal-plan", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("plan_data")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      res.json(data[0]);
    } else {
      res.status(404).json({ message: "Nessun piano alimentare trovato" });
    }
  } catch (error) {
    console.error("Errore recupero piano alimentare:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});