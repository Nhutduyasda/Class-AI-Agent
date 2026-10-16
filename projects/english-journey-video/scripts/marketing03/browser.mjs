import {access} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve} from 'node:path';
export const CHROME_VERSION='157.0.8080.0'; // tested version in pinned Remotion 4.0.535
export const ARCHIVE_URL='https://storage.googleapis.com/chrome-for-testing-public/'+CHROME_VERSION+'/linux64/chrome-headless-shell-linux64.zip';
export const ARCHIVE_SHA256='4d033a390c5b0532dfacd1fca23b0a0b29342c8b82d89cf29a04be52844756ee';
export const CACHE_BROWSER=resolve('.cache/marketing03/chrome-headless-shell-linux64/chrome-headless-shell');
export async function findBrowser(){
 const candidates=[process.env.CHROME_PATH,'/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser',CACHE_BROWSER].filter(Boolean);
 for(const candidate of candidates){try{await access(candidate,constants.X_OK);return resolve(candidate);}catch{}}
 return null;
}
