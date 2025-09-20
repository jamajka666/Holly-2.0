(function(){
  const ACCENTS = ["green","red","orange","cyan"];
  function getAccent(){ const a = localStorage.getItem("holly-accent"); return ACCENTS.includes(a)?a:"green"; }
  function setAccent(a){ document.body.setAttribute("data-accent", a); localStorage.setItem("holly-accent", a); }

  setAccent(getAccent());

  // Accent switch
  const accentBtn = document.getElementById("accentBtn");
  if (accentBtn){
    const setBtn=()=>accentBtn.innerText="Accent: "+getAccent();
    setBtn();
    accentBtn.addEventListener("click", ()=>{
      const idx = (ACCENTS.indexOf(getAccent())+1)%ACCENTS.length;
      setAccent(ACCENTS[idx]); setBtn();
      logLine("Accent -> "+ACCENTS[idx]);
    });
  }

  // Online/offline chip
  const onlineDot = document.getElementById("onlineDot");
  const onlineTxt = document.getElementById("onlineTxt");
  function setOnline(on){ onlineDot?.classList.toggle("on", !!on); if(onlineTxt) onlineTxt.textContent = on?"Online":"Offline"; }
  setOnline(navigator.onLine); window.addEventListener("online",()=>setOnline(true)); window.addEventListener("offline",()=>setOnline(false));

  // Mic toggle (placeholder)
  const micInput = document.getElementById("micToggle");
  const micDot = document.getElementById("micDot");
  const micTxt = document.getElementById("micTxt");
  if (micInput) {
    const saved = localStorage.getItem("holly-mic")==="1";
    micInput.checked = saved; micDot?.classList.toggle("on", saved); micTxt && (micTxt.textContent=saved?"Mic On":"Mic Off");
    micInput.addEventListener("change", ()=>{
      localStorage.setItem("holly-mic", micInput.checked ? "1":"0");
      micDot?.classList.toggle("on", micInput.checked);
      micTxt && (micTxt.textContent = micInput.checked?"Mic On":"Mic Off");
      logLine("Mic: "+(micInput.checked?"ON":"OFF"));
    });
  }

  // Mini log konzole – hook console.*
  const logBox = document.getElementById("console");
  const MAX = 100;
  function logLine(msg, cls){ if(!logBox) return; const p=document.createElement("div"); p.className="logline"+(cls?(" "+cls):""); p.textContent=msg; logBox.appendChild(p); while(logBox.children.length>MAX) logBox.removeChild(logBox.firstChild); logBox.scrollTop = logBox.scrollHeight; }
  const olog=console.log, owarn=console.warn, oerr=console.error;
  console.log=(...a)=>{ try{ logLine(a.join(" ")); }catch{} olog.apply(console,a); }
  console.warn=(...a)=>{ try{ logLine(a.join(" "),"log-warn"); }catch{} owarn.apply(console,a); }
  console.error=(...a)=>{ try{ logLine(a.join(" "),"log-err"); }catch{} oerr.apply(console,a); }

  // Ping
  const pingBtn = document.getElementById("pingBtn");
  if (pingBtn && typeof window.ping === "function") {
    pingBtn.addEventListener("click", ()=>{ window.ping(); console.log("Ping fired"); });
  }
  document.getElementById("refreshBtn")?.addEventListener("click", ()=>location.reload());
})();

// DEMO tlačítka do první karty (pokud existují)
document.addEventListener("DOMContentLoaded", ()=>{
  const firstCard = document.querySelector(".card");
  if(!firstCard) return;
  const row = document.createElement("div");
  row.className="actions";
  row.innerHTML = `
    <button class="btn" id="vaultPutDemo">Vault: Put demo</button>
    <button class="btn" id="vaultGetDemo">Vault: Get demo</button>
    <button class="btn" id="vaultListDemo">Vault: List</button>
  `;
  firstCard.appendChild(row);
  document.getElementById("vaultPutDemo").onclick=()=>console.log(Holly.vaultPut("apiKey","1234-ABCD")));
  document.getElementById("vaultGetDemo").onclick=()=>console.log(Holly.vaultGet("apiKey"));
  document.getElementById("vaultListDemo").onclick=()=>console.log(Holly.vaultList());
});
