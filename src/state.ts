export type JointValues = [number, number, number, number, number, number];
export interface JointDefinition { name: string; min: number; max: number; }
// Configured demo bounds are relative to the neutral pose in this supplied model.
// They are not certified physical travel or collision limits.
export const JOINTS: JointDefinition[] = [
  { name: 'Axis 1', min: -170, max: 170 },
  { name: 'Axis 2', min: -100, max: 145 },
  { name: 'Axis 3', min: -70, max: 205 },
  { name: 'Axis 4', min: -190, max: 190 },
  { name: 'Axis 5', min: -125, max: 125 },
  { name: 'Axis 6', min: -360, max: 360 },
];
export class RobotState {
  private joints: JointValues = [0,0,0,0,0,0];
  private listeners = new Set<(joints: JointValues) => void>();
  get values(): JointValues { return [...this.joints]; }
  setJoint(index: number, degrees: number) {
    if (!Number.isInteger(index) || index < 0 || index > 5 || !Number.isFinite(degrees)) throw new Error('A joint from 1 to 6 and a finite angle are required.');
    const {min,max}=JOINTS[index];
    this.joints[index]=Math.min(max,Math.max(min,degrees));
    this.emit();
    return this.joints[index];
  }
  setJoints(values: Partial<Record<number,number>>) {
    for (const [key,value] of Object.entries(values)) if(!Number.isInteger(Number(key))||Number(key)<0||Number(key)>5||!Number.isFinite(value)) throw new Error('Invalid joint angles.');
    for (const [key,value] of Object.entries(values)) {const index=Number(key);this.joints[index]=Math.max(JOINTS[index].min,Math.min(JOINTS[index].max,value!));}
    this.emit();
    return this.values;
  }
  subscribe(listener:(joints:JointValues)=>void) {this.listeners.add(listener);listener(this.values);return ()=>this.listeners.delete(listener);}
  private emit(){const values=this.values;this.listeners.forEach(listener=>listener(values));}
}
