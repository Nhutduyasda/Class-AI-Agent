"""All generated audio here is synthetic DSP fixture data, NOT fake voices."""
import importlib.util,unittest,tempfile,json,hashlib,sys
from unittest.mock import patch
from pathlib import Path
import numpy as np
spec=importlib.util.spec_from_file_location('bilingual_audio',Path(__file__).with_name('audio.py'));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class AudioTests(unittest.TestCase):
    def tone(self):
        t=np.arange(48000)/48000;a=.1*np.sin(2*np.pi*440*t);a[:480]=0;a[-480:]=0;return a
    def test_silence_safe_join_preserves_samples_and_speech_middle(self):
        a=self.tone();b=self.tone();joined=mod.safe_join([a,b],5760)
        self.assertEqual(len(joined),len(a)+len(b)+5760);np.testing.assert_array_equal(joined[480:47520],a[480:47520]);self.assertTrue(np.all(joined[48000:53760]==0))
    def test_non_silent_edges_refuse_join_without_clipping_syllables(self):
        with self.assertRaisesRegex(ValueError,'SILENCE_REVIEW'):mod.safe_join([np.full(1000,.1),np.full(1000,.1)],5760)
    def test_roundtrip_and_loudness_no_pitch_rate_or_sample_count_change(self):
        with tempfile.TemporaryDirectory(dir='.cache') as tmp:
            path=Path(tmp)/'fixture.wav';a=self.tone();normalized,metric=mod.normalized(a,path,-17);self.assertEqual(len(a),len(normalized));self.assertTrue(np.isfinite(float(metric['input_i'])));mod.write_wav(path,normalized);b=mod.read_wav(path);self.assertEqual(len(a),len(b));self.assertEqual(np.argmax(abs(np.fft.rfft(a))),np.argmax(abs(np.fft.rfft(b))));after=mod.loudness(path);self.assertLessEqual(float(after['input_tp']),-1.5);self.assertLess(abs(float(after['input_i'])+17),.5)
    def test_wav_clipping_is_refused(self):
        with tempfile.TemporaryDirectory(dir='.cache') as tmp:
            with self.assertRaisesRegex(ValueError,'CLIPPING'):mod.write_wav(Path(tmp)/'bad.wav',np.array([1.1]))
    def fixture_project(self,folder):
        mod.write_wav(folder/'demo.wav',self.tone());sha=hashlib.sha256((folder/'demo.wav').read_bytes()).hexdigest()
        plan={'productionId':'offline-dsp-test','planSha256':'offline-fixture-hash','mode':'multivoice','profile':{'splitGapMs':120},'requests':[{'id':'demo','scene':'demo'}]}
        timeline={'planSha256':plan['planSha256'],'timing':'OFFLINE_TEST_FIXTURE_ONLY','audioSamples':76800,'scenes':[{'type':'demo','startFrame':0,'endFrame':48}],'voiceSpans':[{'voice':'vi-VN-NamMinhNeural','startMs':100,'endMs':500},{'voice':'en-US-AndrewNeural','startMs':500,'endMs':900}]}
        ledger={'kind':'OFFLINE_FIXTURE_ONLY','planSha256':plan['planSha256'],'calls':[{'id':'demo','status':'VERIFIED','sha256':sha}]}
        for name,data in [('plan.json',plan),('timeline.json',timeline),('ledger.json',ledger)]: (folder/name).write_text(json.dumps(data),encoding='utf-8')
    def test_full_offline_mixer_sample_clock_loudness_and_no_public_export(self):
        with tempfile.TemporaryDirectory(dir='.cache') as tmp:
            folder=Path(tmp);self.fixture_project(folder)
            with patch.object(sys,'argv',['audio.py',str(folder/'plan.json'),str(folder),'--offline-fixture']):mod.main()
            mix=mod.read_wav(folder/'mix.wav');self.assertEqual(mix.shape,(76800,2));report=json.loads((folder/'mix-qa.json').read_text());self.assertEqual(report['kind'],'OFFLINE_FIXTURE_ONLY');self.assertFalse(Path('public/bilingual/offline-dsp-test').exists())
    def test_production_mixer_refuses_mock_without_explicit_fixture_mode(self):
        with tempfile.TemporaryDirectory(dir='.cache') as tmp:
            folder=Path(tmp);self.fixture_project(folder)
            with patch.object(sys,'argv',['audio.py',str(folder/'plan.json'),str(folder)]):
                with self.assertRaisesRegex(ValueError,'REAL_AUDIO'):mod.main()
if __name__=='__main__':unittest.main(verbosity=2)
