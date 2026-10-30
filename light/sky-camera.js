// Geometry and interpolation shared by the panorama, solar camera and clicks.
const D=Math.PI/180,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function sunCameraRay(p,u,v,fov=20,aspect=1){
 const h=p.sun*D,a=(p.sunAz||0)*D,tx=(2*u-1)*Math.tan(fov*D/2),ty=(1-2*v)*Math.tan(fov*D/2)/aspect;
 const s=[Math.cos(h)*Math.cos(a),Math.cos(h)*Math.sin(a),Math.sin(h)],right=[-Math.sin(a),Math.cos(a),0],up=[-Math.sin(h)*Math.cos(a),-Math.sin(h)*Math.sin(a),Math.cos(h)];
 const ray=s.map((x,i)=>x+tx*right[i]+ty*up[i]),n=Math.hypot(...ray);
 return {elevation:Math.asin(clamp(ray[2]/n,-1,1))/D,azimuth:Math.atan2(ray[1],ray[0])/D};
}
export function bracket(list,x){x=clamp(x,list[0],list.at(-1));let i=0;while(i<list.length-2&&list[i+1]<x)i++;return[i,(x-list[i])/(list[i+1]-list[i])]}
export function sampleSkyRGB(q,p,elevation,azimuth){
 let a=azimuth;if(q.azimuthFrame==='solar-symmetric')a=Math.abs(((azimuth-(p.sunAz||0)+540)%360)-180);
 const [i,u]=bracket(q.xs,a),[j,v]=bracket(q.ys,elevation),g=q.grid;
 return [0,1,2].map(k=>(g[j][i][k]*(1-u)+g[j][i+1][k]*u)*(1-v)+(g[j+1][i][k]*(1-u)+g[j+1][i+1][k]*u)*v);
}
export function skyDisplay(q,p){
 let total=0,area=0;for(let j=0;j<q.ys.length;j++)for(let i=0;i<q.xs.length;i++){const rgb=q.grid[j][i],weight=(q.xs[Math.min(i+1,q.xs.length-1)]-q.xs[Math.max(0,i-1)])*(q.ys[Math.min(j+1,q.ys.length-1)]-q.ys[Math.max(0,j-1)]);total+=weight*Math.log(1e-9+.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]);area+=weight;}
 const average=Math.exp(total/area),gain=p.displayMode==='fixed'?10**p.exposure:Math.max(.01,Math.min(1e6,.35/Math.max(average,1e-9)))*10**(p.exposure-2.5);
 return rgb=>{const peak=Math.max(...rgb);if(peak<=0)return[0,0,0];const mapped=peak*gain/(1+peak*gain);return rgb.map(x=>{const v=Math.max(0,x/peak*mapped);return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))})};
}
