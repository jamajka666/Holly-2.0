import { parseIntent, Intent } from "./commands";
import { useAlerts } from "../state/alerts";
import { apiListDevices, apiPingDevice, apiVaultLock, apiVaultUnlock } from "../lib/api";
import { useToast } from "../lib/toast";
import { applyProfile } from "../theme/tokens";
import { useVoice } from "./state";

export function useVoiceRouter(){
  const { markAllRead, clear, items } = useAlerts();
  const { push: toast, dnd, setDnd } = useToast();
  const { pushLog } = useVoice();

  async function act(intent: Intent){
    pushLog({ kind:"intent", text: JSON.stringify(intent) });
    switch (intent.type) {
      case "open":
        if (intent.target === "settings") window.location.assign("/settings");
        else if (intent.target === "devices") window.location.assign("/devices");
        else window.location.assign("/");
        toast({message:`Opened ${intent.target||"dashboard"}`, variant:"info"});
        pushLog({ kind:"result", text:`open → ${intent.target||"dashboard"}` });
        break;

      case "notifications":
        if (intent.action === "clear") { clear(); toast({message:"Notifications cleared", variant:"success"}); pushLog({kind:"result", text:"notifications → cleared"}); }
        else { markAllRead(); toast({message:"Notifications marked as read", variant:"info"}); pushLog({kind:"result", text:"notifications → read"}); }
        break;

      case "device":
        if (intent.action === "ping") {
          try {
            const list = await apiListDevices();
            const target = intent.target?.toLowerCase();
            const found = target ? list.find(d => d.name.toLowerCase().includes(target)) : list[0];
            if (!found) { toast({message:`Device not found: ${intent.target||"—"}`, variant:"warning"}); pushLog({kind:"error", text:"device not found"}); return; }
            await apiPingDevice(found.id);
            toast({message:`Ping sent to ${found.name}`, variant:"success"});
            pushLog({kind:"result", text:`ping → ${found.name}`});
          } catch (e:any) {
            toast({message:`Ping error: ${e?.message||"unknown"}`, variant:"error"});
            pushLog({kind:"error", text:String(e?.message||"ping error")});
          }
        }
        break;

      case "vault":
        try {
          if (intent.action === "unlock") { await apiVaultUnlock({ pin: intent.pin }); toast({message:"Vault unlocked", variant:"success"}); pushLog({kind:"result", text:"vault → unlocked"}); }
          else { await apiVaultLock(); toast({message:"Vault locked", variant:"info"}); pushLog({kind:"result", text:"vault → locked"}); }
        } catch (e:any) {
          toast({message:`Vault error: ${e?.message||"unknown"}`, variant:"error"});
          pushLog({kind:"error", text:String(e?.message||"vault error")});
        }
        break;

      case "dnd":
        setDnd(intent.on);
        toast({message:`DND ${intent.on ? "enabled":"disabled"}`, variant: intent.on ? "warning":"info"});
        pushLog({kind:"result", text:`dnd → ${intent.on?"on":"off"}`});
        break;

      case "theme":
        applyProfile(intent.profile);
        toast({message:`Theme: ${intent.profile}`, variant:"success"});
        pushLog({kind:"result", text:`theme → ${intent.profile}`});
        break;

      case "status":
        const recent = items.slice(0,3).map(a=>`${a.level}: ${a.message}`).join(" • ") || "No recent alerts";
        toast({title:"Status", message: recent, variant:"info"});
        pushLog({kind:"result", text:`status → ${recent}`});
        break;

      case "help":
        toast({title:"Voice help", message:"Try: 'open devices', 'ping device BV5300', 'vault unlock pin 1234'", variant:"info"});
        pushLog({kind:"result", text:"help → shown"});
        break;
    }
  }

  return {
    async handle(text:string){ return act(parseIntent(text)); },
    async handleWithLogs(text:string){
      // použij při final transcriptu
      pushLog({ kind:"heard", text });
      return act(parseIntent(text));
    }
  }
}
