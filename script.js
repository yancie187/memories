/* =========================
CONFIG
========================= */

const SUPABASE_URL = "YOUR_SUPABASE_URL"
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"

const ADMIN_USER = "noeladianes"
const ADMIN_PASS = "jepoyduday111"

/* =========================
CREATE SUPABASE CLIENT
========================= */

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

/* =========================
LOGIN SYSTEM
========================= */

function login(){

const user = document.getElementById("username").value
const pass = document.getElementById("password").value

if(user === ADMIN_USER && pass === ADMIN_PASS){

localStorage.setItem("logged","true")

window.location = "dashboard.html"

}else{

alert("Wrong user or password")

}

}

/* =========================
PROTECT DASHBOARD
========================= */

if(window.location.pathname.includes("dashboard.html")){

if(localStorage.getItem("logged") !== "true"){

window.location = "index.html"

}

}

/* =========================
LOGOUT
========================= */

function logout(){

localStorage.removeItem("logged")

window.location = "index.html"

}

/* =========================
PAGE SETTINGS
========================= */

let page = 0
const limit = 8

/* =========================
PAGE LOAD
========================= */

document.addEventListener("DOMContentLoaded",()=>{

const input = document.getElementById("fileInput")

if(input){

input.addEventListener("change",(e)=>{

uploadFile(e.target.files[0])

})

}

const dropArea = document.getElementById("dropArea")

if(dropArea){

dropArea.addEventListener("dragover",(e)=>{

e.preventDefault()

})

dropArea.addEventListener("drop",(e)=>{

e.preventDefault()

uploadFile(e.dataTransfer.files[0])

})

}

if(document.getElementById("gallery")){

loadGallery()

}

})

/* =========================
IMAGE COMPRESSION
========================= */

function compressImage(file){

return new Promise((resolve)=>{

new Compressor(file,{
quality:0.6,
success(result){
resolve(result)
}
})

})

}

/* =========================
UPLOAD FILE
========================= */

async function uploadFile(file){

const progress = document.getElementById("progressBar")

progress.style.width = "10%"

if(file.type.includes("image")){

file = await compressImage(file)

}

const filePath = "files/" + Date.now() + "-" + file.name

await client.storage
.from("gallery-files")
.upload(filePath,file)

progress.style.width = "70%"

const {data} = client.storage
.from("gallery-files")
.getPublicUrl(filePath)

await client
.from("gallery")
.insert({
url:data.publicUrl,
type:file.type
})

progress.style.width = "100%"

loadGallery()

setTimeout(()=>{
progress.style.width="0%"
},1000)

}

/* =========================
LOAD GALLERY
========================= */

async function loadGallery(){

const {data} = await client
.from("gallery")
.select("*")
.order("created_at",{ascending:false})
.range(page*limit,page*limit+limit)

const gallery = document.getElementById("gallery")

gallery.innerHTML = ""

data.forEach(item=>{

let html = ""

if(item.type.includes("image")){

html = `<img src="${item.url}">`

}else{

html = `<video controls src="${item.url}"></video>`

}

html += `<button onclick="deleteFile(${item.id})">Delete</button>`

const div = document.createElement("div")

div.innerHTML = html

gallery.appendChild(div)

})

}

/* =========================
DELETE FILE
========================= */

async function deleteFile(id){

await client
.from("gallery")
.delete()
.eq("id",id)

loadGallery()

}

// PAGINATION
function nextPage(){
  page++;
  loadGallery();
}

function prevPage(){
  if(page > 0){
    page--;
    loadGallery();
  }
}

// Drag & Drop + File Input
document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("fileInput");
  if(input){
    input.addEventListener("change", (e) => {
      uploadFile(e.target.files[0]);
    });
  }

  const dropArea = document.getElementById("dropArea");
  if(dropArea){
    dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropArea.style.borderColor = "#60a5fa"; // Highlight on hover
    });

    dropArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropArea.style.borderColor = "#374151"; // Reset border
    });

    dropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      dropArea.style.borderColor = "#374151";
      uploadFile(e.dataTransfer.files[0]);
    });
  }

});
