import { useEffect } from "react";
import { connectSSE } from "../lib/sse";
import { useAlerts } from "../state/alerts";
import { useToast } from "../lib/toast";

export default function useAlertsStream(){
  const { push } = useAlerts();
  const { push: pushToast } = useToast();

  useEffect(()=>{
    const conn = connectSSE("/api/alerts/stream", {
      onOpen(){ /* ok */ },
      onError(){ /* reconnect handled */ },
      onMessage(ev){
        try{
          const obj = JSON.parse(ev.data); // {id, level, message, ts}
          push(obj);
          pushToast({
            title: obj.level.toUpperCase(),
            message: obj.message,
            variant: obj.level === "error" ? "error" : obj.level === "warning" ? "warning" : "info",
          });
        }catch{}
      }
    });
    return ()=> conn.close();
  },[push, pushToast]);
}
