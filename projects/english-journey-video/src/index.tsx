import React from 'react';
import {Composition, registerRoot} from 'remotion';
import pilot from '../briefs/pilot-lesson15.json';
import {Video} from './Video';
import {briefSchema, propsSchema} from './story';
const brief = briefSchema.parse(pilot);
const Root = () => <Composition id="EnglishJourney" component={Video} width={1080} height={1920} fps={30} durationInFrames={900} schema={propsSchema} defaultProps={{brief}} calculateMetadata={({props})=>({durationInFrames:props.narration?.durationInFrames ?? Math.round(props.brief.targetDurationSeconds*props.brief.fps),fps:props.brief.fps,width:props.brief.width,height:props.brief.height})}/>;
registerRoot(Root);
