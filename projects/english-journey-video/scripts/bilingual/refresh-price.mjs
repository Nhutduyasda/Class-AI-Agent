// Public retail catalogue GET only. Never authenticates or calls Speech TTS.
import {writeFile} from 'node:fs/promises';
const filter="armRegionName eq 'southeastasia' and productName eq 'Azure Speech' and meterName eq 'S1 Neural Text To Speech Characters'";
const uri='https://prices.azure.com/api/retail/prices?currencyCode=USD&$filter='+encodeURIComponent(filter);
const response=await fetch(uri,{redirect:'error',signal:AbortSignal.timeout(20000)});
if(!response.ok)throw Error('PUBLIC_PRICE_LOOKUP_FAILED');
const body=await response.json();
const items=body.Items?.filter(i=>i.currencyCode==='USD'&&i.armRegionName==='southeastasia'&&i.meterName==='S1 Neural Text To Speech Characters'&&i.unitOfMeasure==='1M'&&i.type==='Consumption'&&i.retailPrice>0);
if(body.NextPageLink||items?.length!==1)throw Error('EXACT_NEURAL_RETAIL_METER_REQUIRED');
const item=items[0];
const price={schemaVersion:1,verified:true,currency:'USD',region:'southeastasia',usdPerMillion:item.retailPrice,meterName:item.meterName,unitOfMeasure:item.unitOfMeasure,meterId:item.meterId,publicSkuLabel:item.skuName,resourceTierClaim:'Standard S0 (owner configuration; account contract not inspected)',checkedAt:new Date().toISOString(),source:'https://prices.azure.com/api/retail/prices',query:filter,invoiceVerified:false};
await writeFile('config/bilingual-neural-price.json',JSON.stringify(price,null,2)+'\n');
console.log(JSON.stringify({status:'PUBLIC_RETAIL_PRICE_VERIFIED_NO_TTS',usdPerMillion:price.usdPerMillion,meterId:price.meterId}));
