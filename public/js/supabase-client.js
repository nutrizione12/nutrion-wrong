import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm";

export const supabase = createClient(
  "https://rxfsimfzadxofnxmsuey.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZnNpbWZ6YWR4b2ZueG1zdWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDEyOTYsImV4cCI6MjA1Njc3NzI5Nn0.Lgmhl2Mq8ofaa7khOrCM7A5wpZ6wjQsvj-dYGeuesXk",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Disabilita persistenza automatica
      detectSessionInUrl: false,
    },
  },
);
