/*
 * @Author: FuWenHao
 * @Date: 2021-04-12 20:00:47
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-04-13 14:45:04
 */
import * as vscode from 'vscode'
import * as path from 'path'
/**
 *command:  edgeros.showAddDevView
 *show add device page
 */
export = function (context: vscode.ExtensionContext) {
  // Track currently webview panel
  let currentPanel: vscode.WebviewPanel | undefined
  const disposable = vscode.commands.registerCommand('edgeros.testView', (...options: string[]) => {
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined
    if (currentPanel) {
      currentPanel.reveal(columnToShowIn)
    } else {
      // create web view
      currentPanel = vscode.window.createWebviewPanel('addDeviceView', 'Add Device', vscode.ViewColumn.One, {
        // Enable scripts in the webview
        enableScripts: true
      })
      // get path to resource on disk
      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, 'resources', 'media', 'giphy.gif')
      )
      // And get the special URI to use with the webview
      currentPanel.webview.asWebviewUri(onDiskPath)
      currentPanel.webview.html = getWebviewContent2()
      // Triggered when the view is moved
      currentPanel.onDidChangeViewState(e => {
        const panel = e.webviewPanel
        switch (panel.viewColumn) {
          case vscode.ViewColumn.One:
            updateWebviewForCat(panel, 'codingCat')
            return

          case vscode.ViewColumn.Two:
            updateWebviewForCat(panel, 'compilingCat')
            return

          case vscode.ViewColumn.Three:
            updateWebviewForCat(panel, 'testingCat')
        }
      },
      null,
      context.subscriptions)

      setInterval(() => {
        if (currentPanel) {
          currentPanel.webview.postMessage({ command: 'refactor' })
        }
      }, 5000)

      // Triggered when the view is close
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined
        },
        null,
        context.subscriptions
      )

      // Handle messages from the webview
      currentPanel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'alert':
              vscode.window.showErrorMessage(message.text)
          }
        },
        undefined,
        context.subscriptions
      )
    }
  })
  context.subscriptions.push(disposable)
};

const cats = {
  codingCat: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  compilingCat: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
  testingCat: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif'
}

function getWebviewContent (cat: keyof typeof cats, localGif?: vscode.Uri) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="${cats[cat]}" width="300" />
    <img src="${localGif}" width="300" />
</body>
</html>`
}

function getWebviewContent2 () {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
    <h1 id="lines-of-code-counter">0</h1>

    <script>
        const counter = document.getElementById('lines-of-code-counter');

        let count = 0;
        setInterval(() => {
            counter.textContent = count++;
        }, 100);

        // Handle the message inside the webview
        window.addEventListener('message', event => {
            const message = event.data; // The JSON data our extension sent

            switch (message.command) {
                case 'refactor':
                    count = Math.ceil(count * 0.5);
                    counter.textContent = count;
                    break;
            }
        });
    </script>
</body>
</html>`
}

function updateWebviewForCat (panel: vscode.WebviewPanel, catName: keyof typeof cats) {
  panel.title = catName
  panel.webview.html = getWebviewContent(catName)
}
