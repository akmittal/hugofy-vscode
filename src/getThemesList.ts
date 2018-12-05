import * as request from 'request';
import * as https from 'https';
import { Agent } from 'http';

export class HugoTheme {
    constructor(
        public name: string,
        public url: string) {}
}

export const getThemesList = (): Promise<Array<HugoTheme>> => {
    return new Promise((resolve, reject) => {
        const url = 'https://api.github.com/repos/spf13/hugoThemes/contents';
        const headers = {
            'User-Agent': 'akmittal'
        };
        request(url, {headers}, (error, response, body) => {
            try {
                let parsedData = JSON.parse(body);
                let items = parsedData
                    .filter(item => item.name !== '.gitmodules' && item.name !== 'LICENSE' && item.name !== 'README.md')
                    .map(item => new HugoTheme(item.name, item.url));
                resolve(items);
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    });
};

export function getThemeGitURL(themedata: HugoTheme): Promise<string> {
    console.log(themedata);
    const options = {
        hostname: 'api.github.com',
        port: 443,
        method: 'GET',
        path: themedata.url.slice(22),
        headers: {
            'User-Agent': 'akmittal',
        }
    };
    return new Promise((resolve, reject) => {
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    let parsedData = JSON.parse(data);
                    let items = parsedData;
                    resolve(items.submodule_git_url);
                } catch (e) {
                    console.error(e);
                    reject(e);
                }
            });

        });
    });
}
