const memberTitle = document.getElementById("memberTitle");
const uploadForm = document.getElementById("uploadForm");
const docList = document.getElementById("docList");
const message = document.getElementById("message");

const memberId = new URLSearchParams(window.location.search).get("id");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
let userId = null;

async function init() {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return;
  }
  if (!memberId) {
    window.location.href = "dashboard.html";
    return;
  }
  userId = data.session.user.id;

  const { data: member, error } = await db
    .from("members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (error || !member) {
    window.location.href = "dashboard.html";
    return;
  }

  memberTitle.textContent = member.name + "'s Documents";
  loadDocuments();
}

async function loadDocuments() {
  const { data, error } = await db
    .from("documents")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    showMessage("❌ " + error.message, "error");
    return;
  }

  docList.innerHTML = "";

  if (data.length === 0) {
    docList.innerHTML = "<li class='empty'>No documents yet.</li>";
    return;
  }

  data.forEach(function (doc) {
    const li = document.createElement("li");
    li.className = "doc";

    const info = document.createElement("span");
    info.textContent = doc.title + " · " + doc.category;

    const actions = document.createElement("div");
    actions.className = "actions";

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", () => viewDoc(doc));

    const dlBtn = document.createElement("button");
    dlBtn.textContent = "Download";
    dlBtn.className = "secondary";
    dlBtn.addEventListener("click", () => downloadDoc(doc));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "danger";
    delBtn.addEventListener("click", () => deleteDoc(doc));

    actions.append(viewBtn, dlBtn, delBtn);
    li.append(info, actions);
    docList.appendChild(li);
  });
}

uploadForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("docTitle").value.trim();
  const category = document.getElementById("docCategory").value;
  const file = document.getElementById("docFile").files[0];

  if (!file) return;

  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.type)) {
    showMessage("Only PDF, JPG or PNG files are allowed.", "error");
    return;
  }
  if (file.size > MAX_SIZE) {
    showMessage("File is too big. Maximum is 10 MB.", "error");
    return;
  }

  showMessage("Uploading...", "");

  // Clean the file name and make the path unique
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = userId + "/" + memberId + "/" + Date.now() + "-" + safeName;

  // Step 1: upload the file
  const { error: uploadError } = await db.storage
    .from("documents")
    .upload(path, file);

  if (uploadError) {
    showMessage("❌ " + uploadError.message, "error");
    return;
  }

  // Step 2: save the details in the table
  const { error: dbError } = await db.from("documents").insert({
    member_id: memberId,
    title: title,
    category: category,
    file_path: path,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size
  });

  if (dbError) {
    // Undo the upload so we don't leave an orphan file
    await db.storage.from("documents").remove([path]);
    showMessage("❌ " + dbError.message, "error");
    return;
  }

  showMessage("✅ Uploaded successfully!", "success");
  uploadForm.reset();
  loadDocuments();
});

async function viewDoc(doc) {
  const win = window.open("", "_blank"); // open first so the browser doesn't block it

  const { data, error } = await db.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 60); // link works for 60 seconds

  if (error) {
    if (win) win.close();
    showMessage("❌ " + error.message, "error");
    return;
  }
  if (win) win.location.href = data.signedUrl;
}

async function downloadDoc(doc) {
  const { data, error } = await db.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 60, { download: doc.file_name });

  if (error) {
    showMessage("❌ " + error.message, "error");
    return;
  }
  window.location.href = data.signedUrl;
}

async function deleteDoc(doc) {
  if (!confirm("Delete " + doc.title + "? This cannot be undone.")) return;

  const { error: fileError } = await db.storage
    .from("documents")
    .remove([doc.file_path]);

  if (fileError) {
    showMessage("❌ " + fileError.message, "error");
    return;
  }

  const { error: dbError } = await db.from("documents").delete().eq("id", doc.id);

  if (dbError) {
    showMessage("❌ " + dbError.message, "error");
    return;
  }

  loadDocuments();
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = type;
}

init();