import unittest,re
from observed import observed_groups,align_phrases
class ObservedEndpointTests(unittest.TestCase):
    def test_zero_word_becomes_phrase_with_actual_endpoints(self):
        text='ChatGPT rồi chỉ';expected=list(re.finditer(r'\S+',text));mapping={0:{'word':'ChatGPT','start':2.6,'end':5.14},1:{'word':'rồi','start':5.14,'end':5.14},2:{'word':'chỉ','start':5.14,'end':5.42}}
        groups=observed_groups(expected,mapping)
        self.assertEqual((groups[0]['start'],groups[0]['end']),(2.6,5.14));self.assertEqual(text[expected[groups[0]['first']].start():expected[groups[0]['last']].end()],'ChatGPT rồi')
        self.assertEqual(len(groups),2) # no invented timestamp for rồi
    def test_no_positive_evidence_fails_closed(self):
        with self.assertRaises(ValueError):observed_groups([object()],{0:{'word':'x','start':1,'end':1}})
    def test_bilingual_phrases_select_observed_languages_without_inventing_words(self):
        text='I am agree. Bạn biết chưa?';spans=[{'start':0,'end':11,'language':'en-US'}]
        en=[{'word':w,'start':a,'end':b} for w,a,b in [('I',0,.1),('am',.1,.2),('agree.',.2,.4)]]
        vi=[{'word':w,'start':a,'end':b} for w,a,b in [('Bạn',.6,.7),('biết',.7,.8),('chưa?',.8,.9)]]
        words,groups=align_phrases(text,spans,{'en':en,'vi':vi});self.assertEqual([(g['start'],g['end']) for g in groups],[(0,.4),(.6,.9)]);self.assertEqual([g['source'] for g in groups],['en','vi'])
        self.assertEqual(' '.join(text[words[g['first']].start():words[g['last']].end()] for g in groups),text)
    def test_missing_phrase_is_rejected_instead_of_evenly_timed(self):
        with self.assertRaises(ValueError):align_phrases('I am agree.',[{'start':0,'end':11,'language':'en-US'}],{'en':[],'vi':[]})
if __name__=='__main__':unittest.main()
