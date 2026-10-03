import { JOINTS, RobotState } from './state';
const minus='<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const plus='<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const format=(value:number)=>Object.is(value,-0)?'0':String(value);
export function createGUI(state:RobotState){
 const list=document.querySelector<HTMLElement>('#axis-list')!;
 list.innerHTML=JOINTS.map((joint,i)=>`<div class="axis-row" data-axis="${i+1}"><span class="axis-icon" aria-hidden="true"></span><div class="axis-label"><label for="axis-${i+1}">${joint.name}</label><span class="axis-bounds" id="bounds-${i+1}">${joint.min}° to ${joint.max}°</span></div><div class="angle-controls"><button class="step-button minus" type="button" aria-label="Decrease ${joint.name} by 15 degrees">${minus}</button><div class="angle-input-wrap"><input class="angle-input" id="axis-${i+1}" type="number" inputmode="decimal" min="${joint.min}" max="${joint.max}" step="any" value="0" aria-label="${joint.name} angle in degrees" aria-describedby="bounds-${i+1}" autocomplete="off"/><span class="degree" aria-hidden="true">°</span></div><button class="step-button plus" type="button" aria-label="Increase ${joint.name} by 15 degrees">${plus}</button></div></div>`).join('');
 const rows=Array.from(list.querySelectorAll<HTMLElement>('.axis-row'));
 const announce=(text:string)=>{document.querySelector('#announcements')!.textContent=text;};
 rows.forEach((row,i)=>{
   const input=row.querySelector<HTMLInputElement>('input')!;
   const commit=()=>{const previous=state.values[i];const raw=input.value.trim();const parsed=raw===''?NaN:Number(raw);if(!Number.isFinite(parsed)){input.value=format(previous);announce(`${JOINTS[i].name}: enter a valid number.`);return previous;}const value=state.setJoint(i,parsed);input.value=format(value);if(value!==parsed)announce(`${JOINTS[i].name} limited to ${value} degrees.`);return value;};
   input.addEventListener('change',commit);
   input.addEventListener('blur',commit);
   input.addEventListener('keydown',event=>{if(event.key==='Enter'){commit();input.blur();}if(event.key==='Escape'){input.value=format(state.values[i]);input.blur();}if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();const current=commit();state.setJoint(i,current+(event.key==='ArrowUp'?15:-15));input.value=format(state.values[i]);}});
   row.querySelector('.minus')!.addEventListener('click',()=>{const current=commit();state.setJoint(i,current-15);});
   row.querySelector('.plus')!.addEventListener('click',()=>{const current=commit();state.setJoint(i,current+15);});
 });
 state.subscribe(values=>rows.forEach((row,i)=>{const input=row.querySelector<HTMLInputElement>('input')!;input.value=format(values[i]);(row.querySelector('.minus') as HTMLButtonElement).disabled=values[i]<=JOINTS[i].min;(row.querySelector('.plus') as HTMLButtonElement).disabled=values[i]>=JOINTS[i].max;input.setAttribute('aria-valuenow',format(values[i]));}));
 const collapse=document.querySelector<HTMLButtonElement>('#collapse-button')!;
 collapse.addEventListener('click',()=>{const collapsed=document.querySelector('.controller')!.classList.toggle('is-collapsed');collapse.setAttribute('aria-expanded',String(!collapsed));collapse.querySelector('span')!.textContent=collapsed?'Expand':'Collapse';});
}
