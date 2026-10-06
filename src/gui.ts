import { JOINTS, RobotState } from './state';
const format=(value:number)=>Object.is(value,-0)?'0':String(value);
export function createGUI(state:RobotState){
 const list=document.querySelector<HTMLElement>('#axis-list')!;
 list.innerHTML=JOINTS.map((joint,i)=>`<div class="axis-row" data-axis="${i+1}"><span class="axis-icon" aria-hidden="true"></span><div class="axis-label"><label for="axis-${i+1}">${joint.name}</label></div><div class="angle-controls"><div class="angle-input-wrap"><input class="angle-input" id="axis-${i+1}" type="number" inputmode="decimal" min="${joint.min}" max="${joint.max}" step="any" value="0" aria-label="${joint.name} angle in degrees" autocomplete="off"/><span class="degree" aria-hidden="true">°</span></div><input class="angle-slider" type="range" min="${joint.min}" max="${joint.max}" step="any" value="0" aria-label="${joint.name} angle slider"/></div></div>`).join('');
 const rows=Array.from(list.querySelectorAll<HTMLElement>('.axis-row'));
 const announce=(text:string)=>{document.querySelector('#announcements')!.textContent=text;};
 rows.forEach((row,i)=>{
   const input=row.querySelector<HTMLInputElement>('input')!;
   const commit=()=>{const previous=state.values[i];const raw=input.value.trim();const parsed=raw===''?NaN:Number(raw);if(!Number.isFinite(parsed)){input.value=format(previous);announce(`${JOINTS[i].name}: enter a valid number.`);return previous;}const value=state.setJoint(i,parsed);input.value=format(value);if(value!==parsed)announce(`${JOINTS[i].name} limited to ${value} degrees.`);return value;};
   row.querySelector<HTMLInputElement>('.angle-slider')!.addEventListener('input',event=>{const slider=event.currentTarget as HTMLInputElement;state.setJoint(i,Math.round(Number(slider.value)*100)/100);});
   input.addEventListener('change',commit);
   input.addEventListener('blur',commit);
   input.addEventListener('keydown',event=>{if(event.key==='Enter'){commit();input.blur();}if(event.key==='Escape'){input.value=format(state.values[i]);input.blur();}if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();const current=commit();state.setJoint(i,current+(event.key==='ArrowUp'?1:-1));input.value=format(state.values[i]);}});
 });
 state.subscribe(values=>rows.forEach((row,i)=>{const input=row.querySelector<HTMLInputElement>('input')!;input.value=format(values[i]);const slider=row.querySelector<HTMLInputElement>('.angle-slider')!;slider.value=format(values[i]);slider.setAttribute('aria-valuetext',`${format(values[i])} degrees`);input.setAttribute('aria-valuenow',format(values[i]));}));
 const collapse=document.querySelector<HTMLButtonElement>('#collapse-button')!;
 collapse.addEventListener('click',()=>{const collapsed=document.querySelector('.controller')!.classList.toggle('is-collapsed');collapse.setAttribute('aria-expanded',String(!collapsed));collapse.querySelector('span')!.textContent=collapsed?'Expand':'Collapse';});
}
