import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
export default function ThemeToggle(){
  const [dark, setDark] = useState(true);
  useEffect(()=>{
    document.documentElement.classList.toggle("dark", dark);
    (document.body as any).style.setProperty("--bg-carbon","url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%230b0f12%22/><circle cx=%2225%22 cy=%2225%22 r=%221%22 fill=%22%2312171c%22/></svg>')");
  },[dark]);
  return (
    <button className="btn" onClick={()=>setDark(v=>!v)} aria-label="Toggle theme">
      {dark ? <Sun size={16}/> : <Moon size={16}/>} 
      <span className="hidden sm:inline">{dark? "Light":"Dark"}</span>
    </button>
  )
}
