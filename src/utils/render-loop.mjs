/** Runs only while invalidated or while the draw function is settling. */
export function createDemandLoop(draw,{request=callback=>globalThis.requestAnimationFrame(callback),cancel=id=>globalThis.cancelAnimationFrame(id)}={}){
 let frame=null,disposed=false,last=0;
 function tick(time){frame=null;if(disposed)return;const delta=last?Math.min((time-last)/1000,.1):1/60;last=time;const moving=draw(time,delta);if(moving&&!disposed&&frame===null)frame=request(tick);else if(frame===null)last=0;}
 function invalidate(){if(!disposed&&frame===null)frame=request(tick);}
 function pause(){if(frame!==null)cancel(frame);frame=null;last=0;}
 return {invalidate,pause,dispose(){disposed=true;pause();}};
}
export function chooseDpr(deviceDpr,lowPower=false){return Math.min(deviceDpr,lowPower?1:1.4);}
export function lowerDpr(current,averageFrameMs){return averageFrameMs>24?Math.max(.8,Math.round((current-.15)*100)/100):current;}
