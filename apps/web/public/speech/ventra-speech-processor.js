/* Ventra Speech Worklet: microphone PCM never leaves the local device.
 * Sends bounded 1024-sample mono chunks to the same-origin UI for sherpa.
 * Worklet output stays silent: microphone cannot feed the speakers.
 */
class VentraSpeechProcessor extends AudioWorkletProcessor {
 constructor(){
  super();this.samples=new Float32Array(1024);this.offset=0;
 }
 process(inputs,outputs){
  const channel=inputs[0]?.[0];
  if(channel){
   for(let i=0;i<channel.length;i++){
    this.samples[this.offset++]=channel[i];
    if(this.offset===this.samples.length){
     const ready=this.samples;
     this.port.postMessage(ready,[ready.buffer]);
     this.samples=new Float32Array(1024);
     this.offset=0;
    }
   }
  }
  for(const output of outputs)for(const channel of output)channel.fill(0);
  return true;
 }
}
registerProcessor('ventra-speech-processor',VentraSpeechProcessor);
