/* =========================
CONFIG
========================= */
const SUPABASE_URL = "https://rziospcthcuehwgkldjy.supabase.co"; // replace with your Supabase project URL
const SUPABASE_KEY = "sb_publishable_EQYC74VgfkY4iV65VVackw_rynHO9Vx"; // replace with your anon key
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USER = "noeladianes";      // set your username
const ADMIN_PASS = "jepoyduday111";     // set your password

let page = 0;
const limit = 8;

/* =========================
LOGIN & DASHBOARD PROTECTION
========================= */
function login(){
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if(user === ADMIN_USER && pass === ADMIN_PASS){
    localStorage.setItem("logged","true");
    window.location="dashboard.html";
  }else{
    alert("Wrong user or password");
  }
}

if(window.location.pathname.includes("dashboard.html")){
  if(localStorage.getItem("logged") !== "true"){
    window.location="index.html";
  }
}

/* =========================
LOGOUT
========================= */
function logout(){
  localStorage.removeItem("logged");
  window.location="index.html";
}

/* =========================
UPLOAD FILE
========================= */
async function uploadFile(file){
  if(!file) return;

  const progress = document.getElementById("progressBar");
  progress.style.width="10%";

  // Compress images
  if(file.type.includes("image")){
    file = await new Promise(resolve=>{
      new Compressor(file,{quality:0.6, success(result){ resolve(result); }});
    });
  }

  const filePath = "files/" + Date.now() + "-" + file.name;

  // Upload to Supabase Storage
  const { error: uploadError } = await client.storage.from("gallery-files").upload(filePath, file);
  if(uploadError){ alert("Upload failed: "+uploadError.message); progress.style.width="0%"; return; }

  progress.style.width="70%";

  // Get public URL
  const { data } = client.storage.from("gallery-files").getPublicUrl(filePath);

  // Insert row
  const { error: dbError } = await client.from("gallery").insert([{url:data.publicUrl,type:file.type}]);
  if(dbError){ alert("DB insert failed: "+dbError.message); progress.style.width="0%"; return; }

  progress.style.width="100%";
  setTimeout(()=>{ progress.style.width="0%"; },1000);

  loadGallery();
}

// File input listener
document.getElementById("fileInput").addEventListener("change",(e)=>{
  uploadFile(e.target.files[0]);
});

// Drag & drop
const dropArea = document.getElementById("dropArea");
dropArea.addEventListener("dragover",(e)=>{ e.preventDefault(); dropArea.style.borderColor="#60a5fa"; });
dropArea.addEventListener("dragleave",(e)=>{ dropArea.style.borderColor="#374151"; });
dropArea.addEventListener("drop",(e)=>{ e.preventDefault(); dropArea.style.borderColor="#374151"; uploadFile(e.dataTransfer.files[0]); });

/* =========================
LOAD GALLERY
========================= */
async function loadGallery(){
  const { data } = await client.from("gallery").select("*").order("created_at",{ascending:false}).range(page*limit,page*limit+limit);
  const gallery = document.getElementById("gallery");
  gallery.innerHTML="";

  data.forEach(item=>{
    let html = "";
    if(item.type.includes("image")){
      html=`<img src="${item.url}">`;
    }else{
      html=`<video controls src="${item.url}"></video>`;
    }
    html += `<button onclick="deleteFile(${item.id})">Delete</button>`;
    const div = document.createElement("div");
    div.innerHTML=html;
    gallery.appendChild(div);
  });
}

/* =========================
DELETE FILE
========================= */
async function deleteFile(id){
  await client.from("gallery").delete().eq("id",id);
  loadGallery();
}

/* =========================
PAGINATION
========================= */
function nextPage(){ page++; loadGallery(); }
function prevPage(){ if(page>0){ page--; loadGallery(); } }

// Load gallery on page load
if(window.location.pathname.includes("dashboard.html")) loadGallery();
