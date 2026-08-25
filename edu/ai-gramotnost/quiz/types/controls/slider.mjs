import { node } from '../dom.mjs';

export function sliderControl(question, answer) {
  if (question.payload?.widget === 'neuron') {
    const wrap=node('div',{className:'quiz-neuron-widget'}); const controls=node('div',{className:'quiz-neuron-controls'}); const state={length:0,links:2,threshold:2};
    const ns='http://www.w3.org/2000/svg'; const svg=document.createElementNS(ns,'svg'); svg.setAttribute('viewBox','0 0 420 180'); svg.setAttribute('role','img'); svg.setAttribute('aria-label','Dva vstupy vedou přes váhy do neuronu a rozhodnutí spam.');
    const svgText=(x,y,value)=>{const item=document.createElementNS(ns,'text');item.setAttribute('x',String(x));item.setAttribute('y',String(y));item.textContent=value;svg.append(item);};
    const svgLine=(x1,y1,x2,y2)=>{const item=document.createElementNS(ns,'line');[['x1',x1],['y1',y1],['x2',x2],['y2',y2]].forEach(([key,value])=>item.setAttribute(key,String(value)));svg.append(item);};
    svgLine(100,45,205,90);svgLine(100,135,205,90);svgLine(255,90,360,90);svgText(10,48,'délka textu');svgText(10,138,'počet odkazů');svgText(200,95,'Σ → práh');svgText(365,95,'spam?');
    const score=node('output',{textContent:'0 z 5 správně'});
    const update=()=>{const correct=(question.payload.examples||[]).filter((sample)=>(((sample.length*state.length)+(sample.links*state.links))>=state.threshold)===sample.spam).length;answer.value={value:correct,weights:{length:state.length,links:state.links,threshold:state.threshold}};score.textContent=`${correct} z 5 správně`;};
    [['Váha délky','length',-3,3],['Váha odkazů','links',-3,3],['Práh','threshold',-4,8]].forEach(([title,key,min,max])=>{const label=node('label',{textContent:`${title}: `});const input=node('input',{type:'range',min,max,step:'1',value:String(state[key])});const out=node('output',{textContent:String(state[key])});input.addEventListener('input',()=>{state[key]=Number(input.value);out.textContent=input.value;update();});label.append(input,out);controls.append(label);});
    wrap.append(svg,controls,score);update();return wrap;
  }
  const payload = question.payload || {};
  const range = node('input', { type: 'range', min: payload.min, max: payload.max, step: payload.step || 1, value: payload.min });
  const output = node('output', { textContent: `${payload.min}${payload.unit ? ` ${payload.unit}` : ''}` });
  range.addEventListener('input', () => { answer.value = { value: Number(range.value) }; output.textContent = `${range.value}${payload.unit ? ` ${payload.unit}` : ''}`; });
  return node('div', { className: 'quiz-slider' }, [range, output]);
}
