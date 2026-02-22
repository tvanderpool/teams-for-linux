const { BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const windowStateKeeper = require('electron-window-state');
const windowManager = require('../windowManager');

/**
 * Factory function that creates a BrowserWindow for a Teams meeting.
 *
 * The caller is responsible for loading a URL via meetingWindow.loadURL(url).
 * This factory does NOT load any URL itself.
 *
 * @param {object} config - App startup configuration
 * @returns {Electron.BrowserWindow} The created meeting BrowserWindow
 */
function createMeetingWindow(config) {
  const meetingWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
    file: 'meeting-window-state',
  });

  const meetingWindow = new BrowserWindow({
    x: meetingWindowState.x,
    y: meetingWindowState.y,
    width: meetingWindowState.width,
    height: meetingWindowState.height,
    minWidth: 480,
    minHeight: 320,
    title: 'Teams Meeting',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      partition: 'persist:teams-for-linux-session',
      preload: path.join(__dirname, '..', 'browser', 'preload.js'),
      plugins: true,
      spellcheck: true,
      webviewTag: true,
      // SECURITY: Disabled for Teams DOM access, compensated by IPC validation
      contextIsolation: false,  // Required for ReactHandler DOM access
      nodeIntegration: false,   // Secure: preload scripts don't need this
      sandbox: false,           // Required for system API access
    },
  });

  meetingWindowState.manage(meetingWindow);

  windowManager.register('meeting', 'meeting', meetingWindow);

  meetingWindow.on('close', async (e) => {
    if (meetingWindow.forceClose) {
      return;
    }
    e.preventDefault();
    const { response } = await dialog.showMessageBox(meetingWindow, {
      type: 'question',
      buttons: ['Leave', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: 'Leave Meeting',
      message: 'Leave meeting? Closing this window will end your participation.',
    });
    if (response === 0) {
      meetingWindow.forceClose = true;
      meetingWindow.close();
    }
  });

  meetingWindow.on('closed', () => {
    windowManager.unregister('meeting');
  });

  meetingWindow.webContents.on('did-navigate', (_event, url) => {
    if (!new RegExp(config.meetupJoinRegEx).test(url)) {
      meetingWindow.forceClose = true;
      meetingWindow.close();
    }
  });

  return meetingWindow;
}

module.exports = { createMeetingWindow };
