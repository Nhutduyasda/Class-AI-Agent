import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Marketing,marketingSchema,type MarketingProps} from './Marketing';
const empty:MarketingProps={timeline:{durationInFrames:1650,durationSeconds:55,audioSrc:'marketing/mix.wav',scenes:[{type:'hook',startFrame:0,endFrame:1650}],tokens:[],pages:[],events:[],facts:{original:'',correction:''}}};
registerRoot(()=> <Composition id="EnglishJourneyMarketing01" component={Marketing} schema={marketingSchema} defaultProps={empty} width={1080} height={1920} fps={30} durationInFrames={1650} calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames})}/>);
