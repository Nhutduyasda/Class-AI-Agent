import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Marketing04,type Timeline04} from './Marketing04';
const timeline:Timeline04={durationInFrames:2400,durationSeconds:80,audioSrc:'marketing04/mix.wav',scenes:[{type:'hook',startFrame:0,endFrame:2400}],pages:[],tokens:[],markers:{}};
registerRoot(()=> <Composition id="EnglishJourneyMarketing04" component={Marketing04} defaultProps={{timeline}} width={1080} height={1920} fps={30} durationInFrames={2400} calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames})}/>);
