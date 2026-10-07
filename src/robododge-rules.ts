export const GATE_SECONDS = 5;
export const COURSE = [0, 1, 2, 0, 3, 4] as const;
export const waveSeconds=(gate:number)=>COURSE[gate]===3?10:GATE_SECONDS;
export const POSES = [
 {name:'Left cutout', axis:3, angle:0}, {name:'Tall cutout', axis:3, angle:90}, {name:'Right cutout', axis:3, angle:180},
 {name:'Base turn +90', axis:1, angle:90}, {name:'Base turn -90', axis:1, angle:-90},
] as const;
export type Phase = 'ready' | 'running' | 'paused' | 'won' | 'lost';
export class DodgeRun {
 phase:Phase='ready'; gate=0; cleared=0; remaining=GATE_SECONDS;
 start(){this.phase='running';this.gate=0;this.cleared=0;this.remaining=waveSeconds(this.gate);}
 pause(){if(this.phase==='running')this.phase='paused';else if(this.phase==='paused')this.phase='running';}
 tick(seconds:number,contact:boolean){
  if(this.phase!=='running')return null;
  if(contact){this.phase='lost';return 'hit';}
  this.remaining=Math.max(0,this.remaining-Math.max(0,seconds));
  if(this.remaining>0)return null;
  this.cleared++;
  if(this.gate===COURSE.length-1)this.phase='won';
  else {this.gate++;this.remaining=waveSeconds(this.gate);}
  return 'clear';
 }
}




