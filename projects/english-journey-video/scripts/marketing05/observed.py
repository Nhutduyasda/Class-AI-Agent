"""Retain observed ASR phrase endpoints when individual word times are invalid.

Never interpolate word timestamps. Every output endpoint comes from an ASR
observation, and each phrase retains its canonical character range.
"""
def observed_groups(expected,mapping):
    groups=[]
    for i in range(len(expected)):
        w=mapping[i];group={'first':i,'last':i,'start':w['start'],'end':w['end'],'words':[w['word']]}
        groups.append(group)
        while len(groups)>1 and (groups[-1]['end']<=groups[-1]['start'] or groups[-1]['start']<groups[-2]['end'] or groups[-2]['end']<=groups[-2]['start']):
            b=groups.pop();a=groups.pop();groups.append({'first':a['first'],'last':b['last'],'start':min(a['start'],b['start']),'end':max(a['end'],b['end']),'words':a['words']+b['words']})
    if any(g['end']<=g['start'] for g in groups):raise ValueError('NO_POSITIVE_OBSERVED_PHRASE')
    return groups

def lexical_mapping(expected,observed):
    import re
    import numpy as np
    norm=lambda s:''.join(re.findall(r'\w+',s.lower()))
    a=[norm(x) for x in expected];b=[norm(x['word']) for x in observed];n,m=len(a),len(b)
    d=np.zeros((n+1,m+1),dtype=int);d[:,0]=np.arange(n+1);d[0,:]=np.arange(m+1)
    for i in range(1,n+1):
        for j in range(1,m+1):d[i,j]=min(d[i-1,j]+1,d[i,j-1]+1,d[i-1,j-1]+(a[i-1]!=b[j-1]))
    result={};i,j=n,m
    while i or j:
        if i and j and d[i,j]==d[i-1,j-1]+(a[i-1]!=b[j-1]):result[i-1]={**observed[j-1],'exact':a[i-1]==b[j-1]};i-=1;j-=1
        elif j and d[i,j]==d[i,j-1]+1:j-=1
        else:i-=1
    return result

def align_phrases(text,spans,passes,cue_starts=()):
    import re
    words=list(re.finditer(r'\S+',text));languages=[]
    for w in words:languages.append('en' if any(s['language']=='en-US' and s['start']<w.end() and s['end']>w.start() for s in spans) else 'vi')
    groups=[];a=0
    for i,w in enumerate(words):
        at_end=i==len(words)-1
        boundary=at_end or i-a>=6 or re.search(r'[.!?;:,][’”\u0027]?$',w[0]) or (not at_end and (languages[i]!=languages[i+1] or any(words[i+1].start()<=c<words[i+1].end() for c in cue_starts)))
        if boundary:groups.append((a,i+1));a=i+1
    maps={lang:lexical_mapping([w[0] for w in words],obs) for lang,obs in passes.items()};candidates=[]
    for a,b in groups:
        row=[]
        for lang,mapping in maps.items():
            if any(i not in mapping for i in range(a,b)):continue
            own=[mapping[i] for i in range(a,b)];exact=sum(w['exact'] for w in own)/(b-a)
            if exact<.6:continue
            start,end=own[0]['start'],own[-1]['end']
            if end<=start:continue
            row.append({'first':a,'last':b-1,'start':start,'end':end,'words':[w['word'] for w in own],'source':lang,'exactRatio':exact,'language':languages[a],'cost':(1-exact)*10+(0 if lang==languages[a] else .3)})
        if not row:raise ValueError('NO_OBSERVED_PHRASE '+text[words[a].start():words[b-1].end()])
        candidates.append(row)
    # Select a monotonic path through actual VI/EN observations. Never adjust an
    # endpoint, interpolate a missing word, or clip an overlap to make it fit.
    states=[(x['cost'],[x]) for x in candidates[0]]
    for row in candidates[1:]:
        following=[]
        for x in row:
            possible=[(cost+x['cost'],path+[x]) for cost,path in states if path[-1]['end']<=x['start']+.000001]
            if possible:following.append(min(possible,key=lambda pair:pair[0]))
        states=following
        if not states:raise ValueError('NO_MONOTONIC_OBSERVED_PHRASE_PATH')
    return words,min(states,key=lambda pair:pair[0])[1]
