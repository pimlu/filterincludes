// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as os from 'os';
import { dirname } from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';


let info = (s: string) => vscode.window.showInformationMessage(s);
let error = (s: string) => vscode.window.showErrorMessage(s);
function runCommand(cmd: string, cwd: string) {
  return new Promise((resolve, reject) => {
    execFile('/bin/sh', ['-c', cmd], { cwd }, (e, out, err) => {
      //console.log(out.trim().split('\n').pop());
      //console.log(err.trim().split('\n').pop());
    }).on('exit', code => {
      resolve(code === 0);
    });
  });
}
//vscode-filtertext
//Copyright (c) 2015 yhirose
function getCwd(uri: vscode.Uri): string {

  const isFileOrUntitledDocument = uri && (uri.scheme === 'file' || uri.scheme === 'untitled');
  if (isFileOrUntitledDocument) {
    const useDocumentDirAsWorkDir = vscode.workspace.getConfiguration('filterText').useDocumentDirAsWorkDir;

    if (useDocumentDirAsWorkDir && uri.scheme === 'file') {
      return dirname(uri.fsPath);
    }

    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (folder) {
      return folder.uri.fsPath;
    }

    const folders = vscode.workspace.workspaceFolders;
    if (folders != undefined && folders.length > 0) {
      return folders[0].uri.fsPath;
    }
    // Github #9: if no workspace folders, and uri.scheme !== 'untitled' (i.e. existing file), use folder of that file. Otherwise, use user home directory.
    if (uri.scheme !== 'untitled') {
      return dirname(uri.fsPath);
    }
  }

  return os.homedir();
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.filterIncludes', () => {
    // The code you place here will be executed every time your command is executed


    const editor = vscode.window.activeTextEditor;
    if (!editor) return error("No active text editor");
    if (editor.selections.length > 1) return error("Multiple text is selected!");
    let s = editor.selection;
    if (!s.start.isBefore(s.end)) return error("Range is not selected");

    let options: vscode.InputBoxOptions = {
      prompt: "Command to run build",
      placeHolder: "cd build && make -j12",
      value: context.workspaceState.get('lastCommand')
    };
    vscode.window.showInputBox(options).then(async cmd => {
      if (!cmd) return Promise.reject('blank');
      context.workspaceState.update('lastCommand', cmd);
      let filepath = editor.document.fileName;

      let linesText = editor.document.getText(s);
      let lo = editor.document.offsetAt(s.start);
      let hi = editor.document.offsetAt(s.end);
      let data;
      try {
        data = fs.readFileSync(filepath, 'utf8');
      } catch (e) { }
      if (!data || data.substring(lo, hi) !== linesText)
        throw new Error("Filesystem error");
      let pre = data.substring(0, lo);
      let post = data.substring(hi, data.length);
      let lines = linesText.split('\n');
      let keep = Array(lines.length).fill(true);
      let calcFile = () => pre + lines.filter((s, i) => keep[i]).join('\n') + post;
      let update = async (touch: boolean) => {
        await new Promise(async (res, rej) => {
          fs.writeFile(filepath, calcFile(), 'utf8', err => {
            if (err) rej(err);
            else res();
          });
        });
        // trick build systems into thinking this file is out of date
        // even though we're super fast (sometimes builds happen in <1s,
        // which is the timestamp resolution
        let touchCmd = "touch -d '+1 minute' '" + filepath + "'";
        if (touch && !await runCommand(touchCmd, cwd))
          throw new Error('touch failed to set file timestamp');
      };
      let cwd = getCwd(editor.document.uri);
      if (!await runCommand(cmd, cwd))
        throw new Error("Initial invocation failed!");
      for (let i = 0; i < lines.length; i++) {
        if (!/\S/.test(lines[i])) continue;
        keep[i] = false;
        await update(true);
        if (!await runCommand(cmd, cwd)) keep[i] = true;
      }
      await update(true);
      if (!await runCommand(cmd, cwd)) {
        keep.fill(true);
        await update(false);
        throw new Error("Something went wrong, reverted.");
      }
      await update(false);
    }).then(() => info('Done!'), err => {
      if (err === 'blank') return;
      error("Failure: " + err.message);
    });
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
