class SchedulerGuard{constructor(){this.running=false;this.pending=false;this.runs=0}async run(task){if(this.running){this.pending=true;return{started:false,reason:'ALREADY_RUNNING'}}this.running=true;this.runs++;try{return{started:true,value:await task()}}finally{this.running=false;if(this.pending)this.pending=false}}}
module.exports={SchedulerGuard};
