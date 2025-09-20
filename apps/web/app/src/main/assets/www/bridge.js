(function(){
  function call(name, args, fallback){
    try{
      if (window.HollyNative && typeof window.HollyNative[name] === 'function') {
        return window.HollyNative[name].apply(window.HollyNative, args||[]);
      }
    }catch(e){ console.error(e); }
    return typeof fallback==="function" ? fallback() : null;
  }
  window.Holly = {
    mic(on){ call('setMic', [!!on]); },
    vaultPut(label, secret){ return call('vaultPut', [label, secret]); },
    vaultGet(label){ return call('vaultGet', [label]); },
    vaultList(){ return call('vaultList', []); },
    vaultDelete(label){ return call('vaultDelete', [label]); },
    vaultExport(){ return call('vaultExport', []); }
  };
})();
