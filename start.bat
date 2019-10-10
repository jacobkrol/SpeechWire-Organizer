@echo off

set /p id="Enter the tournament ID: "

start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "file:///%CD%\src\index.html?id="%id% --user-data-dir="C:/chromedev" --disable-web-security --new-window