const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");
const memberForm = document.getElementById("memberForm");
const memberList = document.getElementById("memberList");
const message = document.getElementById("message");

async function protectPage() {
  const { data } = await db.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  const user = data.session.user;
  const name = user.user_metadata.full_name || user.email;
  welcome.textContent = "Welcome, " + name + " 👋";

  loadMembers();
}

async function loadMembers() {
  const { data, error } = await db
    .from("members")
    .select("*")
    .order("created_at");

  if (error) {
    message.textContent = "❌ " + error.message;
    message.className = "error";
    return;
  }

  memberList.innerHTML = "";

  if (data.length === 0) {
    memberList.innerHTML = "<li class='empty'>No members yet. Add one above.</li>";
    return;
  }

  data.forEach(function (member) {
    const li = document.createElement("li");

        const info = document.createElement("a");
    info.textContent = member.name + " (" + member.relation + ") 📂";
    info.href = "member.html?id=" + member.id;

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "danger";
    del.addEventListener("click", function () {
      deleteMember(member.id, member.name);
    });

    li.appendChild(info);
    li.appendChild(del);
    memberList.appendChild(li);
  });
}

memberForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("memberName").value.trim();
  const relation = document.getElementById("memberRelation").value;

  message.className = "";

  const { error } = await db.from("members").insert({ name, relation });

  if (error) {
    message.textContent = "❌ " + error.message;
    message.className = "error";
  } else {
    message.textContent = "";
    memberForm.reset();
    loadMembers();
  }
});

async function deleteMember(id, name) {
  if (!confirm("Delete " + name + "?")) return;

  const { error } = await db.from("members").delete().eq("id", id);

  if (error) {
    message.textContent = "❌ " + error.message;
    message.className = "error";
  } else {
    loadMembers();
  }
}

logoutBtn.addEventListener("click", async function () {
  await db.auth.signOut();
  window.location.href = "login.html";
});

protectPage();