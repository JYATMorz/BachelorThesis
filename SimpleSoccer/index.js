const { app, BrowserWindow } = require('electron');

function createWindow () {
  var mainWindow = new BrowserWindow({
    width: 500,
    height: 800,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true
    },
    backgroundColor: '#202232'
  });
  mainWindow.loadFile('server/server.html');
}

app.whenReady().then(createWindow);
