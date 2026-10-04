function decisionLabel(result,market){if(!market?.globalForex?.isOpen)return'SNAPSHOT';return['BUY','SELL'].includes(result?.direction)?result.direction:'WAIT'}module.exports={decisionLabel};
