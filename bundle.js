/**
 * This file is only used to be build with "pkg" in order to force the presence of chrome.exe in the build dir.
 * It's not meant to be used locally, even though it can probably work
 * if the "chrome-win/" dir has been extracted from the "build.bat" file.
 */

const path = require('path');

process.env.chrome_path = path.dirname(process.execPath)+"/chrome-win/chrome.exe";

require('./index.js');
