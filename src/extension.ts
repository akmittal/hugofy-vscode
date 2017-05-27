'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getThemesList, getThemeGitURL } from './getThemesList';
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const opn = require('opn');
const os = require('os');

const getDirectories = p => fs.readdirSync(p).filter(f => fs.statSync(p + '/' + f).isDirectory());
let startCmd;
const getVersion = () => {
    const version = spawn('hugo', ['version'], { shell: true });
    version.stdout.on('data', (data) => {
        vscode.window.showInformationMessage(data.toString());
    });

    version.stderr.on('data', (data) => {
        vscode.window.showErrorMessage(data.toString());
    });

    version.on('close', (code) => {
        if (code !== 0) {
            vscode.window.showErrorMessage('Error getting hugo version, Make sure hugo is available in path.');
        }
    });
};
const newSite = () => {
    if (vscode.workspace.rootPath) {
        const newSiteCmd = spawn('hugo', ['new', 'site', `"${vscode.workspace.rootPath}"`], { shell: true });
        newSiteCmd.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        newSiteCmd.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        newSiteCmd.on('close', (code) => {
            if (code !== 0) {
                vscode.window.showErrorMessage('Error getting hugo version, Make sure hugo is available in path.');
            } else {
                vscode.window.showInformationMessage(`Congratulations! Your new Hugo site is created in ${vscode.workspace.rootPath} test`);
            }
        });
    }
};

const build = () => {
    const buildCmd = spawn('hugo', ['--buildDrafts', `-s="${vscode.workspace.rootPath}"`], { shell: true });
    buildCmd.stdout.on('data', (data) => {
        console.log(`std ${data}`);
        vscode.window.showInformationMessage(data.toString());
    });

    buildCmd.stderr.on('data', (data) => {
        console.log(`stderr ${data}`);
        vscode.window.showErrorMessage(data.toString());
    });

    buildCmd.on('close', (code) => {
        console.log(`code ${code}`);
        if (code !== 0) {
            vscode.window.showErrorMessage('Error getting hugo version, Make sure hugo is available in path.');
        }
    });

};

const downloadTheme = () => {
    getThemesList().then(themeList => {
        const themeNames = themeList.map(themeItem => themeItem.name);
        vscode.window.showQuickPick(themeNames).then(selection => {
            const themeData = themeList.find(themeItem => themeItem.name === selection);
            getThemeGitURL(themeData).then(gitURL => {
                const themePath = path.join(vscode.workspace.rootPath, 'themes', themeData.name);
                const downloadThemeCmd = spawn('git', ['clone', gitURL, `"${themePath}"`], { shell: true });
                downloadThemeCmd.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });

                downloadThemeCmd.stderr.on('data', (data) => {
                    console.log(`stderr ${data}`);
                    //vscode.window.showInformationMessage(`Error downloading theme. Make sure git is installed.`);
                });

                downloadThemeCmd.on('close', (code) => {
                    if (code === 0) {
                        vscode.window.showInformationMessage(`successfully downloaded theme ${themeData.name}`);
                    } else {
                        vscode.window.showErrorMessage(`Error downloading theme. Exit code ${code}`);
                    }
                });
            });
        });
    });
};

const newPost = () => {
    vscode.window.showInputBox({ placeHolder: 'Enter filename' }).then((filename) => {
        const newPostPath = path.join(vscode.workspace.rootPath, 'content', 'post', filename);
        const postPath = 'post' + path.sep + filename;
        const newPostCmd = spawn('hugo', ['new', postPath, `-s="${vscode.workspace.rootPath}"`], { shell: true });
        newPostCmd.stdout.on('data', (data) => {
            vscode.window.showInformationMessage(data);
        });
        newPostCmd.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            vscode.window.showInformationMessage(`Error creating new post.`);
        });
        newPostCmd.on('close', (code) => {
            if (code === 0) {
                let uripath = vscode.Uri.file(newPostPath);
                vscode.workspace.openTextDocument(uripath).then((document) => {
                    vscode.window.showTextDocument(document);
                }, err => {
                    console.log(err);
                });
            } else {
                vscode.window.showErrorMessage(`Error creating new post.`);
            }

        });
    });
};

const setTheme = () => {
    const themeFolder = path.join(vscode.workspace.rootPath, 'themes');

    let themeList = getDirectories(themeFolder);
    if (themeList.length === 0) {
        const actions: Array<string> = ['Download Themes'];
        vscode.window.showInformationMessage('No themes available in themes folder', ...actions).then((value) => {
            if (value === 'Download Themes') {
                downloadTheme();
            }
        });
    } else {
        let config = vscode.workspace.getConfiguration('launch');
        vscode.window.showQuickPick(themeList).then(selection => {
            config.update('defaultTheme', selection);
        });
    }
};

const startServer = () => {
    const defaultTheme = getDefaultTheme();
    if (defaultTheme) {
        startCmd = spawn('hugo', ['server', `--theme=${defaultTheme}`, `-s="${vscode.workspace.rootPath}"`, '--buildDrafts', '--watch', '--port=9081'], { shell: true });
    } else {
        vscode.window.showInformationMessage('Deafault theme not set. Please set one');
        setTheme();
    }

    startCmd.stdout.on('data', (data) => {
        if (data.indexOf('building sites') > -1) {
            opn('http://localhost:9081');
        }

        console.log(`stdout: ${data}`);
    });

    startCmd.stderr.on('data', (data) => {
        console.log(data.toString());
        vscode.window.showErrorMessage(`Error running server`);
    });

    startCmd.on('close', (code) => {
        console.log('Command close, code = ', code);
    });

};

const stopServer = () => {
    if (startCmd) {
        if (os.platform() == 'win32') {
            spawn("taskkill", ["/pid", startCmd.pid, '/f', '/t']);
        } 
        else {
            startCmd.kill('SIGTERM');
        }
    } else {
        console.log('No process started');
    }
};

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('hugofy.getVersion', getVersion),
        vscode.commands.registerCommand('hugofy.newSite', newSite),
        vscode.commands.registerCommand('hugofy.newPost', newPost),
        vscode.commands.registerCommand('hugofy.build', build),
        vscode.commands.registerCommand('hugofy.downloadTheme', downloadTheme),
        vscode.commands.registerCommand('hugofy.setTheme', setTheme),
        vscode.commands.registerCommand('hugofy.startServer', startServer),
        vscode.commands.registerCommand('hugofy.stopServer', stopServer));
}

export function deactivate() {
    stopServer();
}

function getDefaultTheme() {
    let config = vscode.workspace.getConfiguration('launch');
    return config.get<string>('defaultTheme');
}


