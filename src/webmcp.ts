import { JOINTS, RobotState } from './state';
type Tool={name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
export function registerRobotTools(state:RobotState){
 const context=(document as Document & {modelContext?:{registerTool:(tool:Tool,options?:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
 if(!context?.registerTool)return;
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const getState=()=>({mode:'simulation',joints:state.values.map((angle,i)=>({axis:i+1,angle,min:JOINTS[i].min,max:JOINTS[i].max})),angleConvention:'independent serial-model degrees; not physical robot commands'});
 const tools:Tool[]=[
  {name:'read_robot_joints',title:'Read robot joint angles',description:'Read current simulated joint angles and enforced model limits. This does not connect to a physical robot.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:getState},
  {name:'set_robot_joint_angles',title:'Set simulated robot joint angles',description:'Update one or more of the six simulated robot joints in degrees. Values are clamped to model bounds. This only changes the visible 3D model.',inputSchema:{type:'object',properties:{joints:{type:'array',minItems:1,maxItems:6,items:{type:'object',properties:{axis:{type:'integer',minimum:1,maximum:6},degrees:{type:'number'}},required:['axis','degrees'],additionalProperties:false}}},required:['joints'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||!('joints' in input)||!Array.isArray(input.joints)||input.joints.length<1||input.joints.length>6)throw new Error('Provide one to six joint angles.');const changes:Partial<Record<number,number>>={};for(const item of input.joints){if(!item||typeof item!=='object'||!Number.isInteger(item.axis)||item.axis<1||item.axis>6||typeof item.degrees!=='number'||!Number.isFinite(item.degrees))throw new Error('Each joint needs axis 1–6 and a finite angle.');changes[item.axis-1]=item.degrees;}state.setJoints(changes);return getState();}}
 ];
 tools.forEach(tool=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability. */}});
}
