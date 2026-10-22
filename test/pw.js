// resolve playwright-core from whichever local install exists (no browser download needed: system Chrome is used)
const C=['/workspace/weapon-brawl-test/node_modules/playwright-core','/tmp/npmw/node_modules/playwright-core','/workspace/dp_test/node_modules/playwright-core','playwright-core'];
for(const c of C){try{module.exports=require(c);break;}catch(e){}}
if(!module.exports||!module.exports.chromium)throw new Error('playwright-core not found');
