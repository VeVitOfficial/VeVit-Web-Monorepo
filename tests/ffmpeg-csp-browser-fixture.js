WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])).then(() => {
  document.body.dataset.status = 'wasm-allowed';
}).catch(error => {
  document.body.dataset.status = 'wasm-blocked';
  document.body.textContent = String(error);
});
