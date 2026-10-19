import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Marketing05,type Timeline05} from './Marketing05';
// Empty editor default is never used for a production render.
const timeline:Timeline05={fps:30,durationInFrames:1,audioSrc:'',scenes:[],pages:[],voiceSpans:[],events:[],markers:{}};
registerRoot(()=> <Composition id="EnglishJourneyMarketing05" component={Marketing05} defaultProps={{timeline}} width={1080} height={1920} fps={30} durationInFrames={1} calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames})}/>);
