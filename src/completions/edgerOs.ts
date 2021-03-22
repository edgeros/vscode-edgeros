import * as vscode from 'vscode';
import * as path from 'path';
import { componentItems } from './library';



// 二级补全
class EdgerOs2CompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        let keyList: string[] = Object.keys(componentItems);
        let compItems: any = [];
        keyList.forEach(cmpKey => {
            if (linePrefix.endsWith(cmpKey + '.')) {
                let childrenitems = componentItems[cmpKey].children || {};
                if (childrenitems) {
                    let childrenKeys = Object.keys(childrenitems);
                    childrenKeys.forEach(childKey => {
                        let edgerOS_Completion = new vscode.CompletionItem(childKey, vscode.CompletionItemKind.Variable);
                        edgerOS_Completion.detail = childrenitems[childKey].detail || 'edgerOS';
                        edgerOS_Completion.insertText = new vscode.SnippetString(childrenitems[childKey].insertText || childKey);
                        edgerOS_Completion.commitCharacters = childrenitems[childKey].commitCharacters || ['.'];
                        edgerOS_Completion.documentation = childrenitems[childKey].documentation || 'this is EdgerOs Api';
                        compItems.push(edgerOS_Completion);
                    });
                }
            }
        });
        return compItems;
    }
}


// 补全提醒
class EdgerOsCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        let keyList: string[] = Object.keys(componentItems);
        let compItems: any = [];
        keyList.forEach(cmpKey => {
            let edgerOS_Completion = new vscode.CompletionItem(cmpKey, vscode.CompletionItemKind.Variable);
            edgerOS_Completion.detail = componentItems[cmpKey].detail || 'edgerOS';
            edgerOS_Completion.insertText = new vscode.SnippetString(componentItems[cmpKey].insertText || cmpKey);
            edgerOS_Completion.commitCharacters = componentItems[cmpKey].commitCharacters || ['.'];
            edgerOS_Completion.documentation = componentItems[cmpKey].documentation || 'this is EdgerOs Api';
            compItems.push(edgerOS_Completion);
        });
        return compItems;
    }
}

// 悬停提醒
function provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
    const fileName = document.fileName;
    const workDir = path.dirname(fileName);
    const word = document.getText(document.getWordRangeAtPosition(position));
    if (/package\.json$/.test(fileName)) {
        return new vscode.Hover(`* **名称**：edgerOs\n* **版本**：v1.0.0\n* **许可协议**：TMTC`);
    }
}


// 添加自动补之后的提示方法
export function EdgerOsCompletions(context: vscode.ExtensionContext) {
    let languageType = { scheme: 'file', language: 'javascript' };
    // 补全测试
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(languageType, new EdgerOsCompletionItemProvider()));
    // 判断补全
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(languageType, new EdgerOs2CompletionItemProvider(), '.'));
    // 注册鼠标悬停提示
    context.subscriptions.push(vscode.languages.registerHoverProvider('json', {
        provideHover: provideHover
    }));
}
