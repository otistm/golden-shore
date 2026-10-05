/* Golden Shore: The fog over the open sea, drawn on the graphics card (WebGL, no libraries). It is real smoke with depth:
   - Three banks of fog at different heights above the water. Because the camera looks down at an angle, each sits a little
     higher on screen, so as you sail they slide past each other and the fog has thickness instead of being a flat sheet.
   - Each bank is noise that warps itself (fbm fed through fbm, after Inigo Quilez's domain warping), drifting with the wind.
     The noise comes from a small seeded texture rather than being computed per pixel, which keeps phones fast.
   - Billows are lit from the north-west: a pixel is in shadow when the fog thickens toward the light.
   - The banks are soft smoke (Otis chose it over the ink look). ?fog=ink draws them cel-shaded instead: flat tones with an
     ink outline and stipple in the shadows.
   Where you've sailed is painted into a mask (one soft circle per point of G.fog.p) that thins the fog away. When WebGL isn't
   there, seaFog() in sea.js draws the old flat fog. */
"use strict";
const FOG={cv:null,gl:null,u:null,mask:null,mctx:null,mtex:null,mn:0,mkey:'',noise:null,soft:!/[?&]fog=ink/.test(location.search)};
const FOGB={x:-320,y:-560,w:SEA_W+640,h:SEA_LEN+1120,k:1/8};   // the mask's stretch of sea, in world units, and its scale
const FOG_VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FOG_FS=`#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uN,uM;uniform vec2 uRes,uCam;   // uRes: the canvas in its own pixels
uniform float uZ,uSK,uT,uRS,uSoft;uniform vec4 uB;
float fbm(vec2 p,vec4 c){return(.57*dot(texture2D(uN,p),c)+.29*dot(texture2D(uN,p*2.03+.17),c)+.14*dot(texture2D(uN,p*4.07+.31),c));}
// round domes of fog, one per cell, each a little different in size and place: the cauliflower billows of a cartoon cloud
vec2 hash2(vec2 c){return fract(sin(vec2(dot(c,vec2(127.1,311.7)),dot(c,vec2(269.5,183.3))))*43758.5453);}
float puff(vec2 p){vec2 i=floor(p),f=fract(p);float v=0.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y)),o=hash2(i+g);float d=length(g+.15+o*.7-f)/(.5+.4*o.y);v=max(v,1.-d*d);}
  return v;}
// how thick the fog is at a point of the sea, for the bank at height h: solid fog, thinned away where you've sailed, its edge
// and its shadows made of billows that drift slowly with the wind and slowly change shape
float dens(vec2 w,float h){
  vec2 wind=vec2(uT*6.,-uT*2.5)*(1.+h*.006);
  vec2 wob=(texture2D(uN,w/5000.+vec2(uT*.002,uT*.0013)).rg-.5)*90.;
  vec2 p=(w+wind+wob+vec2(h*3.1,-h*1.7))/170.;
  float b=.68*puff(p)+.32*puff(p*2.3+vec2(4.1,7.3));
  float m=texture2D(uM,(w-uB.xy)/uB.zw).r;
  return (1.-m)*1.05+(b-.6)*.7;}
vec2 at(vec2 s,float h){return vec2((s.x-uCam.x)/uZ,((s.y-uCam.y)/uZ+h)/uSK);}
void main(){
  vec2 s=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uRS;   // CSS pixels from the top left
  float H0=140.,H1=70.,H2=0.,th=.45;
  vec2 w0=at(s,H0),w1=at(s,H1),w2=at(s,H2);
  float d0=dens(w0,H0),d1=dens(w1,H1),d2=dens(w2,H2);
#ifdef GL_OES_standard_derivatives
  float f0=fwidth(d0)*1.5,f1=fwidth(d1)*1.5,f2=fwidth(d2)*1.5;
#else
  float f0=.02,f1=.02,f2=.02;
#endif
  vec3 L0=vec3(.957,.937,.894),L1=vec3(.91,.878,.816),L2=vec3(.855,.816,.745),sh=vec3(.88,.86,.83),ink=vec3(0.);
  vec2 lt=vec2(-22.,-38.);   // toward the light
  bool stip=length(fract(s/6.)-.3)<.13;
  if(uSoft>.5){
    vec3 col=vec3(0.);float a=0.;
    for(int i=0;i<3;i++){float d=i==0?d0:i==1?d1:d2;vec2 w=i==0?w0:i==1?w1:w2;float h=i==0?H0:i==1?H1:H2;vec3 L=i==0?L0:i==1?L1:L2;
      float al=smoothstep(th-.12,th+.14,d);if(al<.002)continue;
      float lit=smoothstep(.06,-.04,dens(w+lt,h)-d);
      vec3 c=mix(L*sh,L,.25+.75*lit);col+=(1.-a)*al*c;a+=(1.-a)*al;}
    gl_FragColor=vec4(col,a);return;}
  // ink style: the nearest bank that's thick enough here, in one flat tone, outlined, with stipple in its shadow
  for(int i=0;i<3;i++){float d=i==0?d0:i==1?d1:d2;
    if(d>th){vec2 w=i==0?w0:i==1?w1:w2;float h=i==0?H0:i==1?H1:H2,fw=i==0?f0:i==1?f1:f2;vec3 L=i==0?L0:i==1?L1:L2;
      bool shade=d<th+.32&&dens(w+lt,h)>d+.04;   // shadows under the billows along the bank's edge; deep fog stays calm
      vec3 c=shade?L*sh:L;if(shade&&stip)c*=.78;
      if(d-th<fw)c=ink;
      gl_FragColor=vec4(c,1.);return;}}
  gl_FragColor=vec4(0.);}`;
/* a seeded, tiling value-noise texture: four channels of smooth noise, 16 features across */
function fogNoise(){if(FOG.noise)return FOG.noise;const N=128,C=16,out=new Uint8Array(N*N*4),sm=t=>t*t*(3-2*t);
  for(let c=0;c<4;c++){const r=RNG('fog-noise',c),g=Array.from({length:C*C},r),at=(x,y)=>g[(y%C)*C+(x%C)];
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const fx=x*C/N,fy=y*C/N,ix=Math.floor(fx),iy=Math.floor(fy),u=sm(fx-ix),v=sm(fy-iy);
      out[(y*N+x)*4+c]=Math.round(255*(at(ix,iy)*(1-u)*(1-v)+at(ix+1,iy)*u*(1-v)+at(ix,iy+1)*(1-u)*v+at(ix+1,iy+1)*u*v))}}
  return FOG.noise=out}
/* set WebGL up on this screen's fog canvas. Returns false (and the flat fog takes over) when it can't. */
function fogInitGL(cv){FOG.cv=cv;FOG.gl=null;FOG.mn=0;FOG.mkey='';
  if(/[?&]fog=flat/.test(location.search))return false;
  let gl=null;try{gl=cv.getContext('webgl',{premultipliedAlpha:true,antialias:false})}catch(e){}if(!gl)return false;
  gl.getExtension('OES_standard_derivatives');
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));return null}return s};
  const vs=sh(gl.VERTEX_SHADER,FOG_VS),fs=sh(gl.FRAGMENT_SHADER,FOG_FS);if(!vs||!fs)return false;
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))return false;
  gl.useProgram(p);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const al=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  const tex=(unit,wrap)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wrap);return t};
  tex(0,gl.REPEAT);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,128,128,0,gl.RGBA,gl.UNSIGNED_BYTE,fogNoise());
  FOG.mtex=tex(1,gl.CLAMP_TO_EDGE);
  const u={};['uN','uM','uRes','uCam','uZ','uSK','uT','uRS','uSoft','uB'].forEach(k=>u[k]=gl.getUniformLocation(p,k));
  gl.uniform1i(u.uN,0);gl.uniform1i(u.uM,1);gl.uniform1f(u.uSK,SK);gl.uniform1f(u.uSoft,FOG.soft?1:0);gl.uniform4f(u.uB,FOGB.x,FOGB.y,FOGB.w,FOGB.h);
  FOG.gl=gl;FOG.u=u;return true}
/* the mask of where you've sailed: a soft white circle per point, added as new points come in */
function fogMask(){const gl=FOG.gl,P=G.fog.p,key=G.seed+'|'+G.sea;
  if(!FOG.mask){FOG.mask=document.createElement('canvas');FOG.mask.width=Math.round(FOGB.w*FOGB.k);FOG.mask.height=Math.round(FOGB.h*FOGB.k);FOG.mctx=FOG.mask.getContext('2d')}
  const x=FOG.mctx;if(FOG.mkey!==key||P.length<FOG.mn*2){FOG.mkey=key;FOG.mn=0;x.globalCompositeOperation='source-over';x.fillStyle='#000';x.fillRect(0,0,FOG.mask.width,FOG.mask.height)}
  if(FOG.mn*2>=P.length&&FOG.up)return;
  for(let i=FOG.mn;i<P.length/2;i++){const cx=(P[i*2]-FOGB.x)*FOGB.k,cy=(P[i*2+1]-FOGB.y)*FOGB.k,r=fogR(i)*1.15*FOGB.k;   // a little wider than the circle you see through, so what you've found is clear of the fog
    const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.62,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill()}
  FOG.mn=P.length/2;FOG.up=true;
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,FOG.mtex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,FOG.mask)}
/* draw the fog for this frame. Returns false when WebGL isn't available, so the flat fog draws instead. */
function fogGL(){const cv=SEA.el.querySelector('#seafog');
  if(FOG.cv!==cv){FOG.up=false;if(!fogInitGL(cv))return false}
  const gl=FOG.gl;if(!gl||gl.isContextLost())return false;
  const rs=Math.min(2,devicePixelRatio||1)*.7,w=Math.round(SEA.vw*rs),h=Math.round(SEA.vh*rs);   // a little under screen resolution: smoke needs no more, and phones stay fast
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  fogMask();const u=FOG.u;gl.viewport(0,0,w,h);
  gl.uniform2f(u.uRes,w,h);gl.uniform2f(u.uCam,SEA.tx,SEA.ty);gl.uniform1f(u.uZ,SEA.Z);gl.uniform1f(u.uRS,rs);
  gl.uniform1f(u.uT,matchMedia('(prefers-reduced-motion:reduce)').matches?0:performance.now()/1000);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);return true}
