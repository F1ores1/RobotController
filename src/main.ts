import './style.css';
import { RobotState } from './state';
import { createGUI } from './gui';
import { createRenderer } from './renderer';
import { registerRobotTools } from './webmcp';
import { createRoboLimbo } from './robododge';
const state=new RobotState();
createGUI(state);
registerRobotTools(state);
createRenderer(state).then(view=>createRoboLimbo(state,view)).catch(error=>{console.error(error);const loading=document.querySelector<HTMLElement>('#loading-state')!;loading.classList.add('error');loading.innerHTML='<span>The 3D view could not load. Please refresh to try again.</span>';});

