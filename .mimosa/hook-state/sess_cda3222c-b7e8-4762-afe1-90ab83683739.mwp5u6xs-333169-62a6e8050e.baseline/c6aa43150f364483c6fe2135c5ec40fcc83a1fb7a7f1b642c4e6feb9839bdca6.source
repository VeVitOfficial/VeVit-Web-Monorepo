(function initSandboxFrame() {
  "use strict";

  const expectedParentOrigin = document.referrer ? new URL(document.referrer).origin : "";
  let activeWorker = null;

  function isRunMessage(event) {
    const data = event.data;
    return event.source === window.parent
      && event.origin === expectedParentOrigin
      && data
      && typeof data === "object"
      && !Array.isArray(data)
      && Object.keys(data).sort().join("\0") === ["code", "nonce", "type"].join("\0")
      && data.type === "vevit-sandbox-run"
      && /^[a-f0-9]{32}$/.test(data.nonce)
      && typeof data.code === "string";
  }

  function workerSource(code, nonce) {
    const prefix = `"use strict";\nconst __nonce=${JSON.stringify(nonce)};\nconst __logs=[];\nconst __format=(value)=>{try{return typeof value==="object"?JSON.stringify(value):String(value)}catch(error){return "[nelze serializovat]"}};\nconsole.log=(...args)=>__logs.push(args.map(__format).join(" "));\nconsole.warn=(...args)=>__logs.push("[WARN] "+args.map(__format).join(" "));\nconsole.error=(...args)=>__logs.push("[ERROR] "+args.map(__format).join(" "));\ntry{\n`;
    const suffix = `\nself.postMessage({type:"vevit-worker-result",nonce:__nonce,logs:__logs,error:null});\n}catch(error){self.postMessage({type:"vevit-worker-result",nonce:__nonce,logs:__logs,error:String(error&&error.message?error.message:error)});}`;
    return prefix + code + suffix;
  }

  window.addEventListener("message", (event) => {
    if (!isRunMessage(event) || activeWorker) return;

    const { code, nonce } = event.data;
    const blobUrl = URL.createObjectURL(new Blob([workerSource(code, nonce)], { type: "text/javascript" }));
    const worker = new Worker(blobUrl);
    activeWorker = worker;

    function respond(logs, error) {
      if (activeWorker !== worker) return;
      activeWorker = null;
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      window.parent.postMessage({ type: "vevit-sandbox-result", nonce, logs, error }, expectedParentOrigin);
    }

    worker.addEventListener("message", (workerEvent) => {
      const data = workerEvent.data;
      const keys = data && typeof data === "object" ? Object.keys(data).sort().join("\0") : "";
      if (workerEvent.target !== worker
          || keys !== ["error", "logs", "nonce", "type"].join("\0")
          || data.type !== "vevit-worker-result"
          || data.nonce !== nonce
          || !Array.isArray(data.logs)
          || data.logs.some((line) => typeof line !== "string")
          || !(data.error === null || typeof data.error === "string")) return;
      respond(data.logs, data.error);
    });

    worker.addEventListener("error", (error) => respond([], error.message || "Spuštění kódu selhalo."), { once: true });
  });
})();
