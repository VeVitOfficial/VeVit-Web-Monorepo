const assert = require('assert');
const Search = require('../../assets/js/search-core.js');
const tools = [
  {slug:'json-formatter',name:'JSON formátovač',description:'Formátujte JSON data.',category:'dev',processing_location:'client',icon:'Braces',new:false,keywords:['json','format'],aliases:['json validator'],status:'working',availability:'available'},
  {slug:'json-schema',name:'JSON Schema validátor',description:'Kontrola schématu.',category:'dev',processing_location:'client',icon:'Braces',new:true,keywords:['schema'],aliases:['json schema'],status:'experimental',availability:'available'},
  {slug:'pdf-merge',name:'Sloučení PDF',description:'Spojí dokumenty.',category:'pdf',processing_location:'client',icon:'Files',new:false,keywords:['pdf','merge'],aliases:['spojit pdf'],status:'working',availability:'available'},
  {slug:'certificate-info',name:'SSL certifikát',description:'Kontrola TLS certifikátu.',category:'security',processing_location:'vevit_server',icon:'Lock',new:false,keywords:['ssl','tls'],aliases:['certifikat'],status:'working',availability:'available'}
];
const index = Search.buildIndex(tools);
assert.equal(Search.normalize('PŘEVODNÍK'), 'prevodnik');
assert.equal(Search.search(index, {q:'JSON'}).results[0].tool.slug, 'json-formatter');
assert.equal(Search.search(index, {q:'json validator'}).results[0].tool.slug, 'json-formatter');
assert.equal(Search.search(index, {q:'jsan'}).results[0].tool.slug, 'json-formatter');
assert.deepEqual(Search.search(index, {q:'pdf', category:'pdf', processing:'client'}).results.map(x=>x.tool.slug), ['pdf-merge']);
assert.equal(new Set(Search.search(index, {q:'json'}).results.map(x=>x.tool.slug)).size, 2);
const state = Search.parseState('?q=PDF&category=pdf&processing=client&status=working&new=1&sort=name', {categories:['pdf','dev'], statuses:['working']});
assert.equal(state.q, 'PDF'); assert.equal(state.category, 'pdf'); assert.equal(state.newOnly, true); assert.equal(state.sort, 'name');
assert.deepEqual(Search.parseState('?category=bad&new=x&sort=bad', {categories:['pdf'],statuses:['working']}), Search.defaultState());
assert.ok(Search.serializeState(state).includes('q=PDF'));
console.log('PASS search core');
