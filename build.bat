@echo off

SET cur_path=%~dp0

ECHO Removing previous build files
DEL /F /S /Q %cur_path%build\chrome-win\
DEL /F /Q %cur_path%build\app.exe

mkdir build\chrome-win

ECHO Building executable
cmd /C pkg index.js -t win --output=build/watch_video.exe --public

ECHO Copy chrome
COPY %cur_path%node_modules\puppeteer\.local-chromium\win64-609904\chrome-win\ %cur_path%build\chrome-win\

ECHO Done!
ECHO Now put the "build" directory in a zip and push it!
