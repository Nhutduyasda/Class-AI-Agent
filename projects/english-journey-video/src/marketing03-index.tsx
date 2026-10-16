import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Marketing03,type Timeline03} from './Marketing03';
const timeline:Timeline03={durationInFrames:2100,durationSeconds:70,audioSrc:'marketing03/mix.wav',scenes:[{type:'hook',startFrame:0,endFrame:2100}],pages:[],tokens:[],markers:{}};
registerRoot(()=> <Composition id="EnglishJourneyMarketing03" component={Marketing03} defaultProps={{timeline}} width={1080} height={1920} fps={30} durationInFrames={2100} calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames})}/>);
