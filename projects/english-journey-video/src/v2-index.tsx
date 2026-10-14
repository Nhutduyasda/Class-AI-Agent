import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {V2,v2Schema,type V2Props} from './V2';
// No generated asset is imported at build time. Production scripts supply real props.
const empty:V2Props={timeline:{durationInFrames:1020,durationSeconds:34,fps:30,audioSrc:'v2/mix.wav',facts:{original:'',revised:''},scenes:[{type:'opening',startFrame:0,endFrame:210},{type:'mistakes',startFrame:210,endFrame:390},{type:'bridge',startFrame:390,endFrame:570},{type:'fullfix',startFrame:570,endFrame:810},{type:'cta',startFrame:810,endFrame:1020}],pages:[],tokens:[],events:[{kind:'spell',frame:230},{kind:'spell',frame:290},{kind:'bridge',frame:430},{kind:'complete',frame:610}]}};
registerRoot(()=> <Composition id="EnglishJourneyV2" component={V2} schema={v2Schema} defaultProps={empty} width={1080} height={1920} fps={30} durationInFrames={1020} calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames})}/>);
