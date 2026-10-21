import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import type { plan } from './engine';
import defaultPlan from '../../fixtures/auto-factory/render-plan.json';
type Plan = ReturnType<typeof plan>;
export const FactoryVideo: React.FC<{
    plan: Plan;
}> = ({ plan: p }) => { const f = useCurrentFrame(), s = p.shots.find(x => f >= x.startFrame && f < x.endFrame); return <AbsoluteFill style={{ background: '#101d32', color: 'white', fontFamily: 'sans-serif', padding: 100, justifyContent: 'center', gap: 70 }}><div style={{ fontSize: 30, color: '#ffcf65' }}>OFFLINE FIXTURE • NO SPEECH • PLACEHOLDER</div><div style={{ fontSize: 38 }}>{p.mode}</div><div style={{ fontSize: 64, fontWeight: 800 }}>{s?.spoken}</div><div style={{ fontSize: 32, color: '#65dacb' }}>Minh • {s?.visibility} • TEXT IDENTITY ONLY</div></AbsoluteFill>; };
// Entry point uses validated JSON inputProps, never a provider or URL.
const Root: React.FC = () => <Composition id="AutoFactory" component={FactoryVideo} width={1080} height={1920} fps={30} durationInFrames={720} defaultProps={{ plan: defaultPlan as Plan }} calculateMetadata={({ props }) => ({ durationInFrames: props.plan.durationInFrames })}/>;
registerRoot(Root);
