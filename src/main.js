import * as THREE from 'three';

const app = document.querySelector('#app');
const start = document.querySelector('#start');
const hud = document.querySelector('#hud');
const nameInput = document.querySelector('#name');
const toast = document.querySelector('#toast');
const clockEl = document.querySelector('#clock');
const weatherEl = document.querySelector('#weather');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ab7c8);
scene.fog = new THREE.FogExp2(0x9ab7c8, 0.0045);
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 900);
camera.position.set(0, 7, 13);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xb9d8ff, 0x2d372c, 1.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6b0, 2.5); sun.position.set(80,120,30); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);

const world = new THREE.Group(); scene.add(world);
const colliders=[];
const keys = new Set();
const player = new THREE.Group(); player.position.set(0,1.1,18); world.add(player);
const body = new THREE.Mesh(new THREE.CapsuleGeometry(.45,.9,6,12), new THREE.MeshToonMaterial({color:0x33445f})); body.castShadow=true; body.position.y=0.7; player.add(body);
const coat = new THREE.Mesh(new THREE.CylinderGeometry(.5,.62,.85,8), new THREE.MeshToonMaterial({color:0x9b3e55})); coat.castShadow=true; coat.position.y=.38; player.add(coat);
const head = new THREE.Mesh(new THREE.SphereGeometry(.36,16,12), new THREE.MeshToonMaterial({color:0xf0c9a4})); head.castShadow=true; head.position.y=1.2; player.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(.39,16,8,0,Math.PI*2,0,Math.PI*.55), new THREE.MeshToonMaterial({color:0x25283d})); hair.position.y=1.32; player.add(hair);

function box(x,y,z,c,px=0,py=0,pz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),new THREE.MeshToonMaterial({color:c}));m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;world.add(m);return m}
function cyl(r,h,c,px,py,pz,seg=10){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),new THREE.MeshToonMaterial({color:c}));m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;world.add(m);return m}
function tree(x,z,s=1){cyl(.22*s,1.8*s,0x5a4637,x,.9*s,z,8);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35*s,1),new THREE.MeshToonMaterial({color:0x496d4e}));crown.position.set(x,2.4*s,z);crown.castShadow=true;world.add(crown)}
function lamp(x,z){cyl(.07,2.5,0x30353b,x,1.25,z,8);const l=cyl(.16,.25,0xffd77a,x,2.6,z,8);l.material.emissive=new THREE.Color(0x7d4e08);}

// Ground and town
box(170,.3,170,0x6e8b63,0,-.15,0);
box(32,.12,10,0x8e8577,0,.02,4); // main road
box(10,.13,100,0x8e8577,0,.03,-35); // north road
box(100,.12,8,0x8e8577,-35,.03,-10); // west road
for(let x=-35;x<=35;x+=10) lamp(x,4);
for(let z=-45;z<=35;z+=12) lamp(5,z);

// Town Hall, climbable tower
box(22,8,16,0xd8c8a9,0,4,-22); box(26,2,20,0x7e6c5e,0,9,-22);
const roof=new THREE.Mesh(new THREE.ConeGeometry(15,8,4),new THREE.MeshToonMaterial({color:0x6f4050}));roof.position.set(0,14,-22);roof.rotation.y=Math.PI/4;roof.castShadow=true;world.add(roof);
box(3,11,3,0xb7a58b,-7,5,-22); box(3,11,3,0xb7a58b,7,5,-22);
box(5,5,1,0x4d5d6a,0,2,-30); // door
for(let y=2;y<=9;y+=1.4){box(8,.25,1.6,0x8a6d52,0,y,-14);}

// District buildings
const colors=[0xcaa989,0x8ea3b4,0xd3b875,0xb38eaa,0x9fb88b];
const spots=[[-28,-4],[-12,-2],[24,-5],[35,8],[-35,13],[28,20],[-24,22]];
spots.forEach(([x,z],i)=>{box(10,6,9,colors[i%colors.length],x,3,z);box(11,.7,10,0x6d4c55,x,6.35,z);lamp(x,z+6);});

// River + bridge
box(7,.08,90,0x4c87a2,18,.02,-15);
for(let z=-45;z<28;z+=2.2) box(7,.04,1.2,0x5e9db8,18,.08,z);
for(let x=13;x<=23;x+=2) box(1.5,.5,10,0x887967,x,.35,4);

// Forest edge and paths
for(let i=0;i<90;i++){const a=Math.random()*Math.PI*2,r=35+Math.random()*48;const x=Math.cos(a)*r,z=Math.sin(a)*r-20;if(Math.abs(x-18)<7) continue;tree(x,z,.65+Math.random()*.65)}

// small floating fireflies
const fireflies=[]; const fireGeo=new THREE.SphereGeometry(.055,6,6); const fireMat=new THREE.MeshBasicMaterial({color:0xfff0a1});
for(let i=0;i<45;i++){const f=new THREE.Mesh(fireGeo,fireMat);f.position.set((Math.random()-.5)*70,1+Math.random()*5,(Math.random()-.5)*80-20);world.add(f);fireflies.push(f)}

// Player movement
let yaw=0, pitch=.28, dragging=false, lastX=0,lastY=0; let velocityY=0; let dayMinutes=8*60; const dayLength=24*60;
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY}); addEventListener('pointerup',()=>dragging=false);
addEventListener('pointermove',e=>{if(!dragging)return; yaw-= (e.clientX-lastX)*.006; pitch-= (e.clientY-lastY)*.004; pitch=Math.max(-.15,Math.min(.8,pitch));lastX=e.clientX;lastY=e.clientY});
addEventListener('keydown',e=>keys.add(e.key.toLowerCase())); addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

function showToast(t){toast.textContent=t;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),2200)}
function updateClock(dt){dayMinutes=(dayMinutes+dt*0.35)%dayLength; const h=Math.floor(dayMinutes/60),m=Math.floor(dayMinutes%60); const phase=h<6?'Night':h<8?'Dawn':h<18?'Day':h<20?'Dusk':'Night';clockEl.textContent=`Day 1 · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} · ${phase}`;const t=(h*60+m)/dayLength;const daylight=Math.max(.08,Math.sin((t-.25)*Math.PI*2)*.5+.5);sun.intensity=.5+2.3*daylight;hemi.intensity=.6+1.4*daylight;scene.background.setHSL(.58,.22,.34+.23*daylight);scene.fog.color.copy(scene.background);}
function move(dt){const speed=(keys.has('shift')?7:4)*dt;const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));let dir=new THREE.Vector3();if(keys.has('w')||keys.has('arrowup'))dir.add(forward);if(keys.has('s')||keys.has('arrowdown'))dir.sub(forward);if(keys.has('d')||keys.has('arrowright'))dir.add(right);if(keys.has('a')||keys.has('arrowleft'))dir.sub(right);if(dir.lengthSq())dir.normalize();player.position.addScaledVector(dir,speed);player.position.x=THREE.MathUtils.clamp(player.position.x,-75,75);player.position.z=THREE.MathUtils.clamp(player.position.z,-85,55);if(keys.has(' ')&&player.position.y<=1.11){velocityY=7}velocityY-=18*dt;player.position.y+=velocityY*dt;if(player.position.y<1.1){player.position.y=1.1;velocityY=0}}
function cameraUpdate(){const target=player.position.clone().add(new THREE.Vector3(0,1.2,0));const dist=10;const cp=Math.cos(pitch);camera.position.set(target.x+Math.sin(yaw)*dist*cp,target.y+Math.sin(pitch)*dist,target.z+Math.cos(yaw)*dist*cp);camera.lookAt(target)}
function save(){localStorage.setItem('whispers-save',JSON.stringify({name:nameInput.value,position:player.position.toArray()}));showToast('Game saved.')}
function interact(){if(player.position.distanceTo(new THREE.Vector3(0,1.1,-22))<12)showToast('Town Hall: the old bell waits above.');else if(player.position.z<-28)showToast('Whisperwood: the deeper forest is still sleeping.');else showToast(`Meridian is quiet, ${nameInput.value}.`)}

nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')document.querySelector('#startBtn').click()}); document.querySelector('#startBtn').addEventListener('click',()=>{start.classList.add('hidden');hud.classList.remove('hidden');const saved=localStorage.getItem('whispers-save');if(saved){try{const s=JSON.parse(saved);if(s.position)player.position.fromArray(s.position);if(s.name)nameInput.value=s.name;}catch{}}showToast(`Welcome to Meridian, ${nameInput.value}.`)});
addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e')interact();if(e.key.toLowerCase()==='f')showToast('Sora whistles back from somewhere beyond the clouds.');if(e.key.toLowerCase()==='t')save();if(e.key==='Escape')showToast('Settings are coming in the next milestone.')});

let prev=performance.now(); function loop(now){const dt=Math.min(.033,(now-prev)/1000);prev=now;move(dt);cameraUpdate();updateClock(dt);fireflies.forEach((f,i)=>{f.position.y+=Math.sin(now*.001+i)*.0007});renderer.render(scene,camera);requestAnimationFrame(loop)} requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
