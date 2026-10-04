const {CONFIG}=require('./config');const {assess}=require('../data/data-quality');function bootstrap(data){return{version:CONFIG.appVersion,quality:assess(data)}}module.exports={bootstrap};
