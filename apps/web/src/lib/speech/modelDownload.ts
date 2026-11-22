/** Streams a model file into a buffer of the manifest size (no extra copy),
 * reporting received bytes at most every 200 ms. A body longer or shorter
 * than the manifest is an integrity error, exactly like before. */
export async function readExactly(response:Response,expected:number,onBytes:(received:number)=>void):Promise<Uint8Array<ArrayBuffer>>{
 const reader=response.body?.getReader();
 if(!reader){
  const whole=new Uint8Array(await response.arrayBuffer());
  if(whole.byteLength!==expected)throw new Error('model-integrity');
  return whole;
 }
 const bytes=new Uint8Array(expected);
 let received=0,lastReport=0;
 for(;;){
  const {done,value}=await reader.read();
  if(done)break;
  if(received+value.byteLength>expected){
   try{await reader.cancel();}catch{}
   throw new Error('model-integrity');
  }
  bytes.set(value,received);
  received+=value.byteLength;
  const now=Date.now();
  if(now-lastReport>=200){lastReport=now;onBytes(received);}
 }
 if(received!==expected)throw new Error('model-integrity');
 return bytes;
}
