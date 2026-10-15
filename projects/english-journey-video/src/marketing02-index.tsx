import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Marketing02,type Timeline02} from './Marketing02';
const timeline:Timeline02={durationInFrames:2250,durationSeconds:75,audioSrc:'marketing02/mix.wav',scenes:[{type:'hook',startFrame:0,endFrame:2250}],pages:[],tokens:[]};
registerRoot(()=> <Composition id="EnglishJourneyMarketing02" component={Marketing02} defaultProps={{timeline}} width={1080} height={1920} fps={30} durationInFrames={2250} calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames})}/>);
