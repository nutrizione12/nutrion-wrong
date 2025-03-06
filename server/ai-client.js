import OpenAI from "openai";
import { AI_TOKEN } from "./config.js";

const client = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: AI_TOKEN,
  timeout: 30000,
});

export const generateMealPlan = async (userData) => {
  const prompt = `Genera un piano alimentare dettagliato in JSON. Requisiti:
- Giorni da Lunedì a Domenica
- Per ogni pasto includi: descrizione, calorie e nutrienti (proteine, carboidrati, grassi IN GRAMMI)
- Calorie totali giornaliere: ${userData.goals === "weight_loss" ? "1500-1800" : "2000-2500"} kcal
- Utente: ${userData.age} anni, ${userData.weight}kg
- Allergie: ${userData.allergies.join(", ") || "nessuna"}
- Preferenze: ${userData.preferences.join(", ") || "nessuna"}

Struttura JSON richiesta:
{
  "days": [
    {
      "day": "Lunedì",
      "meals": {
        "colazione": {
          "descrizione": "...",
          "calorie": ...,
          "nutrienti": {
            "proteine": ...,
            "carboidrati": ...,
            "grassi": ...
          }
        },
        "spuntino_mattina": {...},
        "pranzo": {...},
        "spuntino_pomeriggio": {...},
        "cena": {...}
      },
      "total": {
        "calorie": ...,
        "proteine": ...,
        "carboidrati": ...,
        "grassi": ...
      }
    }
  ]
}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Restituisci SOLO JSON valido senza commenti. Assicurati che tutti i valori numerici siano corretti.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const rawJson = response.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(rawJson);
  } catch (error) {
    console.error("Errore generazione piano:", error);
    throw new Error(`Errore AI: ${error.message}`);
  }
};
