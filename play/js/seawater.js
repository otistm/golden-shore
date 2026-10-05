/* Golden Shore: The water. One wave field for the whole sea: a few swells rolling in from the north-west, each with its own
   length, height and speed (longer swells travel faster, as at sea). Everything afloat reads the water at its own spot every
   frame, so it rises and falls and rocks as a swell passes under it, out of step with ships elsewhere; big ships rock less.
   Your ship also leans into her turns. The sea's surface is drawn from the same field (a WebGL shader under everything), so
   you can watch the swell that lifts a ship roll on past it. Wave marks ride it too. Without WebGL the sea stays a flat colour
   and everything still rides the swell. */
"use strict";
// d: the way the swell travels (radians, east = 0, south = π/2); l: its length; a: its height, in world units
const WAVES=[{d:.65,l:430,a:5.5},{d:.35,l:250,a:3.2},{d:1.05,l:160,a:2},{d:.15,l:95,a:1}];
WAVES.forEach((w,i)=>{w.k=2*Math.PI/w.l;w.dx=Math.cos(w.d);w.dy=Math.sin(w.d);w.w=Math.sqrt(75*w.k);w.p=i*1.9});
/* the sea's height at a point, and the slope of its long swells (gx east, gy south). Hulls tilt only with the long swells:
   the short chop would make them jitter. */
function seaWave(x,y,t){let h=0,gx=0,gy=0;
  for(const w of WAVES){const ph=w.k*(w.dx*x+w.dy*y)-w.w*t+w.p,s=Math.sin(ph);h+=w.a*s;if(w.l<200)continue;const c=Math.cos(ph)*w.a*w.k;gx+=c*w.dx;gy+=c*w.dy}
  return{h,gx,gy}}
const seaTime=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?0:pauseClock();   // stands still while paused
/* move something afloat to ride the water at (x,y): lifted by the swell, tilted by its slope (a heavier hull, L, tilts less) */
function rideSwell(el,x,y,t,L,heel){const w=seaWave(x,y,t),L2=L||1,rot=clamp(Math.atan(w.gx*.8/L2)*57.3,-7,7)+(heel||0),sy=1+clamp(w.gy*.6/L2,-.08,.08);
  el.setAttribute('transform',`translate(0 ${f1(-w.h*.9)}) rotate(${rot.toFixed(2)}) scale(1 ${sy.toFixed(3)})`);return w}
/* every frame: the floats on the water, the wave marks, and the surface */
function seaRide(v){const t=seaTime(),pad=200;
  for(const f of SEA.floats){if(f.x<v.x0-pad||f.x>v.x1+pad||f.y<v.y0-pad||f.y>v.y1+pad)continue;rideSwell(f.el,f.x,f.y,t,f.L)}
  for(const m of SEA.wvs){if(m.x<v.x0||m.x>v.x1||m.y<v.y0||m.y>v.y1)continue;const w=seaWave(m.x,m.y,t);
    m.el.setAttribute('transform',`translate(0 ${f1(-w.h*1.1)}) rotate(${(Math.atan(w.gx*.8)*57.3).toFixed(1)} ${f1(m.x)} ${f1(m.y*SK)})`)}
  waterGL(t)}
/* the floats in what's drawn now: places' groups (and bottles), with their spot on the sea */
function seaFloats(){SEA.floats=[...SEA.el.querySelectorAll('.o-float')].filter(el=>!el.closest('#seaship')).map(el=>{const d=el.closest('[data-wx]');
  return{el,x:+d.dataset.wx,y:+d.dataset.wy,L:+el.dataset.l||.6}})}

/* ---------- the surface ---------- */
const WATER={cv:null,gl:null,u:null};
const WATER_FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uN;uniform vec2 uRes,uCam;uniform float uZ,uSK,uT,uRS;
void main(){
  vec2 s=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uRS,w=vec2((s.x-uCam.x)/uZ,(s.y-uCam.y)/uZ/uSK);
  float h=0.;vec2 g=vec2(0.);
  ${WAVES.map(w=>`{float ph=${(w.k).toFixed(5)}*dot(vec2(${w.dx.toFixed(4)},${w.dy.toFixed(4)}),w)-${w.w.toFixed(4)}*uT+${w.p.toFixed(3)};h+=${w.a.toFixed(2)}*sin(ph);g+=${(w.a*w.k).toFixed(5)}*cos(ph)*vec2(${w.dx.toFixed(4)},${w.dy.toFixed(4)});}`).join('\n  ')}
  // the light comes from the north-west: slopes facing it are paler, the far sides of swells a shade darker; a little noise
  // drifting on top keeps the surface from looking machined
  float lit=dot(normalize(vec3(-g.x,-g.y,1.)),normalize(vec3(-.5,-.8,1.)));
  float r=texture2D(uN,w/520.+vec2(uT*.006,uT*.004)).r-texture2D(uN,w/310.-vec2(uT*.005,0.)).g;
  vec3 sea=vec3(.812,.863,.871),crest=vec3(.875,.914,.914);
  vec3 c=sea+vec3(.03,.026,.022)*clamp(h/9.,-1.,1.);   // crests a touch paler, troughs a touch deeper
  c=mix(c,crest,smoothstep(5.,10.,h)*.55);
  c+=(lit-.7143)*.45+r*.012;   // .7143: the light on flat water
  gl_FragColor=vec4(c,1.);}`;
function waterInit(cv){WATER.cv=cv;WATER.gl=null;if(/[?&]water=flat/.test(location.search))return false;
  let gl=null;try{gl=cv.getContext('webgl',{antialias:false,alpha:false})}catch(e){}if(!gl)return false;
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));return null}return s};
  const vs=sh(gl.VERTEX_SHADER,FOG_VS),fs=sh(gl.FRAGMENT_SHADER,WATER_FS);if(!vs||!fs)return false;
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))return false;gl.useProgram(p);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const al=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);
  [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.REPEAT],[gl.TEXTURE_WRAP_T,gl.REPEAT]].forEach(([k,v])=>gl.texParameteri(gl.TEXTURE_2D,k,v));
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,128,128,0,gl.RGBA,gl.UNSIGNED_BYTE,fogNoise());
  const u={};['uN','uRes','uCam','uZ','uSK','uT','uRS'].forEach(k=>u[k]=gl.getUniformLocation(p,k));gl.uniform1i(u.uN,0);gl.uniform1f(u.uSK,SK);
  WATER.gl=gl;WATER.u=u;return true}
function waterGL(t){const cv=SEA.el.querySelector('#seawater');if(!cv)return;
  if(WATER.cv!==cv&&!waterInit(cv))return;const gl=WATER.gl;if(!gl||gl.isContextLost())return;
  const rs=Math.min(2,devicePixelRatio||1)*.5,w=Math.round(SEA.vw*rs),h=Math.round(SEA.vh*rs);   // smooth swells need few pixels
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  const u=WATER.u;gl.viewport(0,0,w,h);gl.uniform2f(u.uRes,w,h);gl.uniform2f(u.uCam,SEA.tx,SEA.ty);gl.uniform1f(u.uZ,SEA.Z);gl.uniform1f(u.uRS,rs);gl.uniform1f(u.uT,t);
  gl.drawArrays(gl.TRIANGLES,0,3)}
