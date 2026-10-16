<script setup lang="ts">
import {onMounted,onUnmounted,ref,watch} from 'vue';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createDemandLoop,chooseDpr,lowerDpr} from '../utils/render-loop.mjs';
const props=defineProps<{progress:number;opening:number;suspended?:boolean}>();
const emit=defineEmits<{ready:[]}>();
const host=ref<HTMLDivElement|null>(null);
let cleanup=()=>{};
onMounted(()=>{
 if(!host.value)return;
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'default'});}catch{return;}
 const lowPower=(navigator.hardwareConcurrency||4)<=4||(navigator as Navigator&{deviceMemory?:number}).deviceMemory<=4||matchMedia('(max-width: 700px)').matches;
 let pixelRatio=chooseDpr(devicePixelRatio,lowPower),requestDraw=()=>{};
 const detached:THREE.Object3D[]=[];
 const parent=host.value,scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#0c0c0a',.035);
 const camera=new THREE.PerspectiveCamera(35,1,.1,60);
 renderer.setPixelRatio(pixelRatio);renderer.setClearColor('#0e0d0a');
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=!lowPower;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 parent.appendChild(renderer.domElement);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
 const envTarget=pmrem.fromScene(room,.05);scene.environment=envTarget.texture;scene.environmentIntensity=.55;room.dispose();pmrem.dispose();
 const world=new THREE.Group();scene.add(world);
 const mesh=(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0)=>{const item=new THREE.Mesh(g,m);item.position.set(x,y,z);parent.add(item);return item;};
 const steel=new THREE.MeshStandardMaterial({color:'#5f625b',metalness:.9,roughness:.25});
 const black=new THREE.MeshStandardMaterial({color:'#171914',metalness:.5,roughness:.43});
 let micModel:THREE.Object3D|null=null;
 const micRig=new THREE.Group();world.add(micRig);
 const stand=mesh(new THREE.CylinderGeometry(.025,.036,2.1,24),steel,micRig,0,1.09);stand.castShadow=true;
 const base=mesh(new THREE.CylinderGeometry(.32,.36,.07,48),black,micRig,0,.045);base.castShadow=true;
 mesh(new THREE.CylinderGeometry(.05,.05,.12,24),steel,micRig,0,1.3);
 const cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,2.25,-.08),new THREE.Vector3(.07,1.5,-.1),new THREE.Vector3(.03,.08,-.03),new THREE.Vector3(.6,.025,.5),new THREE.Vector3(1.6,.025,1),new THREE.Vector3(2.9,.025,.5)]);
 mesh(new THREE.TubeGeometry(cableCurve,64,.011,6,false),black,micRig);
 const floor=mesh(new THREE.PlaneGeometry(65,65),new THREE.MeshStandardMaterial({color:'#29271f',roughness:.36,metalness:.28}),world);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
 const boards=new THREE.MeshStandardMaterial({color:'#13150f',roughness:.7});
 const seams=new THREE.InstancedMesh(new THREE.BoxGeometry(.005,.002,30),boards,25),seamMatrix=new THREE.Matrix4();
 for(let i=0;i<25;i++){seamMatrix.makeTranslation((i-12)*.7,.003,0);seams.setMatrixAt(i,seamMatrix);}
 seams.instanceMatrix.needsUpdate=true;world.add(seams);
 const key=new THREE.SpotLight('#ffddb0',95,24,.36,.8,1.5);key.position.set(2.4,5.8,3.5);key.target.position.set(1.4,1.9,0);key.castShadow=true;key.shadow.mapSize.set(lowPower?512:768,lowPower?512:768);key.shadow.bias=-.0003;key.shadow.normalBias=.025;key.shadow.camera.near=.3;key.shadow.camera.far=20;scene.add(key,key.target);
 const rim=new THREE.SpotLight('#adc2c9',65,20,.45,.9,1.5);rim.position.set(-2.8,4,-2.2);rim.target.position.set(1.4,2.5,0);scene.add(rim,rim.target);
 const fill=new THREE.PointLight('#f4d6b2',9,15,2);fill.position.set(4,3,2);scene.add(fill);
 scene.add(new THREE.HemisphereLight('#c2c4ba','#141009',.25));
 const loader=new GLTFLoader();let alive=true,modelLoaded=false,contextLost=false;const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const dispose=(root:THREE.Object3D)=>{root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v)});});}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());};
 const prepare=(root:THREE.Object3D)=>root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m instanceof THREE.MeshStandardMaterial){m.envMapIntensity=.7;if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}});}});
 const normalize=(object:THREE.Object3D,height:number)=>{object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=height/size.y;const group=new THREE.Group();group.add(object);object.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));group.scale.setScalar(scale);return group;};
 loader.loadAsync('/models/microphone.glb').then(gltf=>{
  if(!alive){dispose(gltf.scene);return;}
  for(const name of ['Desk microphone base','Stand stem','Stand-to-shock-mount adapter']){const part=gltf.scene.getObjectByName(name);if(part){part.removeFromParent();detached.push(part);}}
  prepare(gltf.scene);const studioMic=normalize(gltf.scene,1.05);studioMic.position.y=2.14;studioMic.rotation.y=-.25;micRig.add(studioMic);micModel=studioMic;renderer.shadowMap.needsUpdate=true;
  renderer.compileAsync(scene,camera).catch(()=>{}).then(()=>{if(alive){modelLoaded=true;requestDraw();}});
 }).catch(()=>{ /* Existing CSS stage stays visible when loading fails. */ });
 const beamMaterial=new THREE.MeshBasicMaterial({color:'#e6d2a7',transparent:true,opacity:.015,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const beam=mesh(new THREE.ConeGeometry(1.55,6.2,48,1,true),beamMaterial,scene,1.7,3.2,.4);beam.rotation.z=-.16;
 const particleGeo=new THREE.BufferGeometry(),positions=new Float32Array(100*3);
 for(let i=0;i<positions.length;i+=3){positions[i]=Math.sin(i*2.7)*5;positions[i+1]=(Math.sin(i*7.2)*.5+.5)*5;positions[i+2]=Math.cos(i*3.8)*3;}
 particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const dust=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:'#d1c49e',size:.009,transparent:true,opacity:.3,depthWrite:false}));scene.add(dust);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const resize=()=>{const width=parent.clientWidth,height=parent.clientHeight;if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();requestDraw();};
 const observer=new ResizeObserver(resize);observer.observe(parent);resize();
 let current=props.progress,intro=props.opening,previousYaw=Infinity,previousLight=Infinity,announced=false,samples=0,averageMs=16.7,lastQualityChange=0;
 const smooth=(a:number,b:number,v:number)=>{const t=THREE.MathUtils.clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
 const shots=[{p:0,angle:0,r:8.8,y:2.65,yaw:0,tilt:0},{p:.17,angle:-.22,r:8.3,y:2.85,yaw:.38,tilt:.02},{p:.3,angle:-.36,r:9,y:2.55,yaw:-.32,tilt:-.015},{p:.46,angle:.28,r:8.4,y:3,yaw:.5,tilt:.025},{p:.64,angle:.4,r:8.15,y:2.65,yaw:-.42,tilt:-.02},{p:.8,angle:-.14,r:9.1,y:2.9,yaw:.22,tilt:.01},{p:1,angle:.1,r:8.7,y:2.6,yaw:0,tilt:0}];
 function render(time:number,delta:number){
  if(document.hidden||props.suspended||contextLost)return false;
  current=reduced?0:THREE.MathUtils.lerp(current,props.progress,1-Math.exp(-delta*4.5));
  intro=reduced?1:props.opening;
  let i=shots.findIndex((s,j)=>j<shots.length-1&&current>=s.p&&current<=shots[j+1].p);if(i<0)i=shots.length-2;
  const a=shots[i],b=shots[i+1],t=smooth(a.p,b.p,current),mix=(k:'angle'|'r'|'y'|'yaw'|'tilt')=>THREE.MathUtils.lerp(a[k],b[k],t);
  const mobile=camera.aspect<.8;
  const reveal=smooth(.02,.78,intro),handoff=reduced?1:smooth(.08,.3,current);
  const r=mix('r')*(mobile?1.18:1),angle=mix('angle')*handoff;
  micRig.position.x=0; // The stand stays fixed; only camera composition changes.
  camera.position.set(Math.sin(angle)*r,mix('y'),Math.cos(angle)*r);
  camera.lookAt((mobile?-.42:-1.0)*handoff,1.55,0);
  if(micModel){micModel.rotation.y=-.25+mix('yaw')*handoff+.24*smooth(.3,.82,intro);micModel.rotation.z=mix('tilt')*handoff;}
  const dark=smooth(.7,.79,current)*(1-smooth(.83,.94,current));
  const illumination=(.07+.93*reveal)*(1-dark*.85);
  key.intensity=110*illumination;rim.intensity=65*(.12+.88*reveal)*(1-dark*.9);
  fill.intensity=9*(.12+.88*reveal)*(1-dark*.85);
  scene.environmentIntensity=.55*(.1+.9*reveal)*(1-dark*.8);
  renderer.toneMappingExposure=(.7+.35*reveal)-dark*.5;
  beamMaterial.opacity=.02*reveal*(1-dark);
  key.position.x=micRig.position.x+1+Math.sin(angle)*1.6;
  key.target.position.x=micRig.position.x;rim.target.position.x=micRig.position.x;beam.position.x=micRig.position.x+.3;
  dust.rotation.y=reduced?0:current*.28;
  const yaw=micModel?.rotation.y??0;if(Math.abs(yaw-previousYaw)>.016||Math.abs(key.position.x-previousLight)>.025){renderer.shadowMap.needsUpdate=true;previousYaw=yaw;previousLight=key.position.x;}
  renderer.render(scene,camera);
  if(modelLoaded&&!announced){announced=true;emit('ready');}
  const moving=!reduced&&(Math.abs(current-props.progress)>.00015||Math.abs(intro-props.opening)>.00015);
  if(moving){averageMs=averageMs*.92+delta*1000*.08;samples++;if(samples>30&&time-lastQualityChange>2000){const next=lowerDpr(pixelRatio,averageMs);if(next!==pixelRatio){pixelRatio=next;renderer.setPixelRatio(pixelRatio);resize();}samples=0;lastQualityChange=time;}}
  return moving;
 }
 const loop=createDemandLoop(render);
 requestDraw=()=>{if(!document.hidden&&!props.suspended)loop.invalidate();};
 const unwatch=watch(()=>[props.progress,props.opening,props.suspended],()=>{if(props.suspended)loop.pause();else if(!reduced)requestDraw();});
 const onVisibility=()=>{if(document.hidden)loop.pause();else requestDraw();};document.addEventListener('visibilitychange',onVisibility);
 const onContextLost=(event:Event)=>{event.preventDefault();contextLost=true;loop.pause();};
 const onContextRestored=()=>{contextLost=false;renderer.shadowMap.needsUpdate=true;requestDraw();};
 renderer.domElement.addEventListener('webglcontextlost',onContextLost);renderer.domElement.addEventListener('webglcontextrestored',onContextRestored);
 requestDraw();
 cleanup=()=>{alive=false;loop.dispose();unwatch();observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',onContextLost);renderer.domElement.removeEventListener('webglcontextrestored',onContextRestored);document.removeEventListener('visibilitychange',onVisibility);dispose(scene);detached.forEach(dispose);envTarget.dispose();key.shadow.dispose();renderer.dispose();renderer.domElement.remove();};
});
onUnmounted(()=>cleanup());
</script>
<template><div ref="host" class="webgl-stage" aria-hidden="true"></div></template>
