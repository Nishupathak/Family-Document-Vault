const button = document.getElementById("testBtn");
const message = document.getElementById("message");

button.addEventListener("click", async function () {
  message.textContent = "Checking connection...";

  const { data, error } = await db.auth.getSession();

  if (error) {
    message.textContent = "❌ Error: " + error.message;
  } else {
    message.textContent = "✅ Connected to Supabase!";
  }
});