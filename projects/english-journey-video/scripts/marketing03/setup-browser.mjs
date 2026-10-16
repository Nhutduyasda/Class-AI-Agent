// Supported vendor Chromium, installed in project cache only. No media render.
import {readFile,mkdir,chmod} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {findBrowser,ARCHIVE_URL,ARCHIVE_SHA256,CACHE_BROWSER} from './browser.mjs';
let browser=await findBrowser();
if(!browser){
 if(process.argv.slice(2).join(' ')!=='--install')throw Error('No installed browser. Run with --install for pinned official Google archive.');
 await mkdir('.cache/marketing03',{recursive:true});
 const archive='.cache/marketing03/chrome-headless-shell-linux64.zip';
 execFileSync('curl',['--fail','--location','--connect-timeout','30','--max-time','180','--retry','0','--output',archive,ARCHIVE_URL],{stdio:'inherit',timeout:185000});
 if(createHash('sha256').update(await readFile(archive)).digest('hex')!==ARCHIVE_SHA256)throw Error('Browser archive hash mismatch');
 execFileSync('unzip',['-o','-q',archive,'-d','.cache/marketing03'],{stdio:'pipe',timeout:30000});
 await chmod(CACHE_BROWSER,0o755);browser=CACHE_BROWSER;
}
console.log(JSON.stringify({browser,version:execFileSync(browser,['--version'],{encoding:'utf8'}).trim(),mediaRendered:false}));
