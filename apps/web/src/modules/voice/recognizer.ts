export function startListening(onText: (t: string) => void) {
  // @ts-ignore
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) throw new Error("SpeechRecognition není podporováno v tomto prohlížeči.");
  const r = new SR();
  r.lang = "cs-CZ";
  r.continuous = true;
  r.interimResults = false;
  r.onresult = (e: any) => {
    const res = e.results[e.results.length - 1][0].transcript;
    onText(res);
  };
  r.start();
  return () => r.stop();
}

