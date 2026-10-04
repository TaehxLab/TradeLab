class ProviderRouter{
 constructor({providers=[],failureThreshold=2,cooldownMs=30000,now=()=>Date.now()}={}){this.providers=providers;this.failureThreshold=failureThreshold;this.cooldownMs=cooldownMs;this.now=now;this.state=new Map(providers.map(p=>[p.name,{failures:0,circuit:'CLOSED',openAt:0,lastSuccess:null,lastFailure:null,latencyMs:null}]))}
 available(){return this.providers.filter(p=>{const s=this.state.get(p.name);if(s.circuit!=='OPEN')return true;if(this.now()-s.openAt>=this.cooldownMs){s.circuit='HALF_OPEN';return true}return false})}
 async request(fetcher){const attempts=[];for(const p of this.available()){const t=this.now();try{const value=await fetcher(p);const s=this.state.get(p.name);Object.assign(s,{failures:0,circuit:'CLOSED',lastSuccess:this.now(),latencyMs:this.now()-t});return{ok:true,provider:p.name,value,attempts}}catch(e){const s=this.state.get(p.name);s.failures++;s.lastFailure=this.now();s.latencyMs=this.now()-t;if(s.failures>=this.failureThreshold){s.circuit='OPEN';s.openAt=this.now()}attempts.push({provider:p.name,error:String(e.message||e)})}}return{ok:false,provider:null,value:null,attempts}}
 health(){return Object.fromEntries([...this.state])}
}
module.exports={ProviderRouter};
