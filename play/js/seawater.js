/* Golden Shore: The water. One wave field for each sea: a few swells, each with its own direction, length, height and speed
   (longer swells travel faster, as at sea), raised or flattened by the day's weather (WAVESETS and WEATHER in seaweather.js). Everything afloat reads the water at its own spot every
   frame, so it rises and falls and rocks as a swell passes under it, out of step with ships elsewhere; big ships rock less.
   Your ship also leans into her turns. The sea's surface is drawn from the same field (a WebGL shader under everything), so
   you can watch the swell that lifts a ship roll on past it. Wave marks ride it too. Without WebGL the sea stays a flat colour
   and everything still rides the swell. */
"use strict";
/* the weather's hand on the waves: long swells (200 units or more) scale by its swell, the short chop by its chop */
const waveMul=w=>WX.cur?(w.l>=200?WX.cur.swell:WX.cur.chop):1;
/* the sea's height at a point, and the slope of its long swells (gx east, gy south). Hulls tilt only with the long swells:
   the short chop would make them jitter. */
function seaWave(x,y,t){let h=0,gx=0,gy=0;
  for(const w of curWaves()){const a=w.a*waveMul(w),ph=w.k*(w.dx*x+w.dy*y)-w.w*t+w.p;h+=a*Math.sin(ph);if(w.l<200)continue;const c=Math.cos(ph)*a*w.k;gx+=c*w.dx;gy+=c*w.dy}
  return{h,gx,gy}}
const seaTime=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?0:pauseClock();   // stands still while paused
/* move something afloat to ride the water at (x,y): lifted by the swell, tilted by its slope (a heavier hull, L, tilts less) */
function rideSwell(el,x,y,t,L,heel){const w=seaWave(x,y,t),L2=L||1,tilt=7+7*Math.max(0,(WX.cur?WX.cur.swell:1)-1),rot=clamp(Math.atan(w.gx*.8/L2)*57.3,-tilt,tilt)+(heel||0),sy=1+clamp(w.gy*.6/L2,-.08,.08);
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
const WATER={cv:null,gl:null,u:null,sea:-1};
/* the surface shader for a sea: its waves are written into the code; the weather comes in as uniforms */
const waterSrc=set=>`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uN;uniform vec2 uRes,uCam,uM,uWO;uniform float uZ,uSK,uT,uRS,uHM,uDark,uCaps,uClouds;
void main(){
  vec2 s=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uRS,w=vec2((s.x-uCam.x)/uZ,(s.y-uCam.y)/uZ/uSK);
  float h=0.;vec2 g=vec2(0.);
  ${set.map(v=>{const m=v.l>=200?'uM.x':'uM.y',d=`vec2(${v.dx.toFixed(4)},${v.dy.toFixed(4)})`;return`{float ph=${v.k.toFixed(5)}*dot(${d},w)-${v.w.toFixed(4)}*uT+${v.p.toFixed(3)};h+=${v.a.toFixed(2)}*${m}*sin(ph);g+=${(v.a*v.k).toFixed(5)}*${m}*cos(ph)*${d};}`}).join(String.fromCharCode(10))}
  // the light comes from the north-west: slopes facing it are paler, the far sides of swells a shade darker; a little noise
  // drifting on top keeps the surface from looking machined
  float lit=dot(normalize(vec3(-g.x,-g.y,1.)),normalize(vec3(-.5,-.8,1.)));
  float r=texture2D(uN,w/520.+vec2(uT*.006,uT*.004)).r-texture2D(uN,w/310.-vec2(uT*.005,0.)).g;
  vec3 sea=vec3(.812,.863,.871),crest=vec3(.875,.914,.914);
  vec3 c=sea+vec3(.03,.026,.022)*clamp(h/9.,-1.,1.);   // crests a touch paler, troughs a touch deeper
  c=mix(c,crest,smoothstep(.45,.9,h/uHM)*.55);
  c+=(lit-.7143)*.45+r*.012;   // .7143: the light on flat water
  // whitecaps break on the highest crests in rough weather
  float n=texture2D(uN,w/90.+vec2(uT*.03,0.)).b;
  c=mix(c,vec3(.95,.965,.955),uCaps*smoothstep(.55,.8,h/uHM)*smoothstep(.42,.62,n));
  // cloud shadows slide over the water on calm days, faster than the swell
  float cl=smoothstep(.52,.62,texture2D(uN,(w+uWO*3.)/2600.).a);
  c*=1.-.1*cl*uClouds;
  // grey water under a heavy sky
  c=mix(c,vec3(.56,.63,.67),uDark*.45);
  gl_FragColor=vec4(c,1.);}`;
function waterInit(cv){WATER.cv=cv;WATER.gl=null;WATER.sea=G.sea;if(/[?&]water=flat/.test(location.search))return false;
  let gl=null;try{gl=cv.getContext('webgl',{antialias:false,alpha:false})}catch(e){}if(!gl)return false;
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));return null}return s};
  const vs=sh(gl.VERTEX_SHADER,FOG_VS),fs=sh(gl.FRAGMENT_SHADER,waterSrc(curWaves()));if(!vs||!fs)return false;
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))return false;gl.useProgram(p);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const al=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);
  [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.REPEAT],[gl.TEXTURE_WRAP_T,gl.REPEAT]].forEach(([k,v])=>gl.texParameteri(gl.TEXTURE_2D,k,v));
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,128,128,0,gl.RGBA,gl.UNSIGNED_BYTE,fogNoise());
  const u={};['uN','uRes','uCam','uZ','uSK','uT','uRS','uM','uWO','uHM','uDark','uCaps','uClouds'].forEach(k=>u[k]=gl.getUniformLocation(p,k));gl.uniform1i(u.uN,0);gl.uniform1f(u.uSK,SK);
  WATER.gl=gl;WATER.u=u;return true}
function waterGL(t){const cv=SEA.el.querySelector('#seawater');if(!cv)return;
  if((WATER.cv!==cv||WATER.sea!==G.sea)&&!waterInit(cv))return;   // each sea's waves are written into its shader
  const gl=WATER.gl;if(!gl||gl.isContextLost())return;
  const rs=Math.min(2,devicePixelRatio||1)*.5,w=Math.round(SEA.vw*rs),h=Math.round(SEA.vh*rs);   // smooth swells need few pixels
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  const u=WATER.u;gl.viewport(0,0,w,h);gl.uniform2f(u.uRes,w,h);gl.uniform2f(u.uCam,SEA.tx,SEA.ty);gl.uniform1f(u.uZ,SEA.Z);gl.uniform1f(u.uRS,rs);gl.uniform1f(u.uT,t);
  const x=WX.cur||WEATHER.breezy;gl.uniform2f(u.uM,x.swell,x.chop);gl.uniform2f(u.uWO,WX.wo[0],WX.wo[1]);gl.uniform1f(u.uDark,x.dark);gl.uniform1f(u.uCaps,x.caps);gl.uniform1f(u.uClouds,x.clouds);
  gl.uniform1f(u.uHM,curWaves().reduce((m,v)=>m+v.a*waveMul(v),0));
  gl.drawArrays(gl.TRIANGLES,0,3)}
