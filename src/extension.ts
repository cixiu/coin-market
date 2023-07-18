// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { WebSocket } from 'ws';

let myStatusBarItem: vscode.StatusBarItem;

let url = 'wss://wspri.okx.com:8443/ws/v5/inner-public';

let webSocket: WebSocket | undefined;

const coinPrices: any[] = [];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // // context.subscriptions
  // // Use the console to output diagnostic information (console.log) and errors (console.error)
  // // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "coin-market" is now active!');

  const myCommandId = 'coin-market.helloWorld';
  // // The command has been defined in the package.json file
  // // Now provide the implementation of the command with registerCommand
  // // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(myCommandId, () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    webSocket && webSocket.close();
    webSocket = undefined;
    webSocket = new WebSocket(url);

    webSocket.onerror = (e) => {
      console.log(e);
      webSocket && webSocket.close();
      webSocket = undefined;
      vscode.window.showErrorMessage('coin-market connect failed!', e.message);
    };

    webSocket.onopen = (e) => {
      vscode.window.showInformationMessage('coin-market connect successed!');
      webSocket!.send(
        JSON.stringify({
          op: 'subscribe',
          args: [
            { channel: 'cup-tickers-3s', ccy: 'BTC' },
            { channel: 'cup-tickers-3s', ccy: 'ETH' },
          ],
        }),
      );
    };

    webSocket.onmessage = (e) => {
      const data = e.data as string;
      const dataObj = JSON.parse(data);
      if (dataObj.event === 'subscribe') {
        return;
      }

      dataObj.data.forEach((item: any) => {
        const price = `${item.last} ${(
          ((item.last - item.sodUtc8) * 100) /
          item.sodUtc8
        ).toFixed(2)}% `;
        if (item.ccy === 'BTC') {
          coinPrices[0] = price;
        }
        if (item.ccy === 'ETH') {
          coinPrices[1] = price;
        }
        const priceStr = coinPrices.join(', ');
        console.log(priceStr);
        myStatusBarItem.text = priceStr;
        myStatusBarItem.show();
      });
    };
  });
  context.subscriptions.push(disposable);

  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0,
  );
  myStatusBarItem.command = myCommandId;
  context.subscriptions.push(myStatusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() {
  webSocket && webSocket.close();
  webSocket = undefined;
  console.log('deactivate');
}
