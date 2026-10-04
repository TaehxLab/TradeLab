const {ema}=require('./ema');function macd(a){const fast=ema(a,12),slow=ema(a,26);return fast==null||slow==null?null:fast-slow}module.exports={macd};
