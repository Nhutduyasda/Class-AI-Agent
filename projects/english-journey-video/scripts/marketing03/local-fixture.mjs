// Deterministic test tone only. Never speech, never an Azure output.
export function localTestWave(seconds=2){
 const rate=48000,n=Math.round(seconds*rate),b=Buffer.alloc(44+n*2);
 b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);
 b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);
 b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++){const t=i/rate,fade=Math.min(1,t/.04,(seconds-t)/.06);b.writeInt16LE(Math.round(3500*fade*(Math.sin(2*Math.PI*440*t)+.25*Math.sin(2*Math.PI*660*t))),44+i*2);}
 return b;
}
