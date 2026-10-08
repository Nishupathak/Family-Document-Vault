const form = document.getElementById("loginForm");
const message = document.getElementById("message");

// If already logged in, skip the login page
db.auth.getSession().then(({ data }) => {
  if (data.session) {
    window.location.href = "dashboard.html";
  }
});

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  message.className = "";
  message.textContent = "Logging in...";

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    message.textContent = "❌ " + error.message;
    message.className = "error";
  } else {
    window.location.href = "dashboard.html";
  }
});
document.getElementById("forgotLink").addEventListener("click", async function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    message.textContent = "Type your email above first.";
    message.className = "error";
    return;
  }

  const { error } = await db.auth.resetPasswordForEmail(email);

  if (error) {
    message.textContent = "❌ " + error.message;
    message.className = "error";
  } else {
    message.textContent = "✅ If this email exists, a reset link has been sent.";
    message.className = "success";
  }
});