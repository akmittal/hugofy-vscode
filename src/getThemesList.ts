const https = require('https');


export const getThemesList = (): Promise<Array<any>> => {
    const options = {
        hostname: 'api.github.com',
        port: 443,
        path: '/repos/spf13/hugoThemes/contents',
        method: 'GET',
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
                    let items = parsedData
                        .filter((item =>
                            (item.name !== '.gitmodules' &&
                                item.name !== 'LICENSE' &&
                                item.name !== 'README.md')
                        )).map(item =>
                            ({
                                name: item.name,
                                url: item.url
                            })
                        );
                    resolve(items);

                } catch (e) {
                    reject(e);
                }
            });

        });
    });
};
export const getThemeGitURL = (themedata) => {
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
                    reject(e);
                }
            });

        });
    });
};
