const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (e) {
  e.preventDefault(); // stop the page from reloading

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  message.className = "";

  if (password.length < 6) {
    message.textContent = "Password must be at least 6 characters.";
    message.className = "error";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match.";
    message.className = "error";
    return;
  }

  message.textContent = "Creating your account...";

  const { data, error } = await db.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) {
    message.textContent = "❌ " + error.message;
    message.className = "error";
  } else {
        message.textContent = "✅ Account created! Check your email and click the confirmation link, then login.";
    message.className = "success";
        form.reset();
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
  }
});