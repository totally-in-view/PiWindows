# PiWindows
https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/troubleshooting.md

*****************************************************************************************************************************
TIV Pi Hub and Reporting (PiHR like FIHR) Installation Process for Windows: 
NOTE: Make sure you're using nodejs v10.15.*.  v10.19.0 did not work correctly.
*****************************************************************************************************************************
Install Better-sqlite3
    npm install better-sqlite3-helper
*****************************************************************************************************************************
Install globally node-qyp 
    npm install --global node-gyp
*****************************************************************************************************************************
Either via sudo or via a CMD with 'Run as Adminsitrator', install the production version of Visual Studio 2015 build tools for Node 
    sudo npm install --global --production --vs2015 --add-python-to-path windows-build-tools
*****************************************************************************************************************************
VS includes Python v2.7.15, so add python to your USERPATH and SYSTEM PATHs on Windows:
    npm install --global --production --add-python-to-path windows-build-tools node-gyp
with the PATH updates, you need to restart your terminal or CMD prompt windows
*****************************************************************************************************************************
Then install the package dependency
    npm install
*****************************************************************************************************************************
With the dependencies installed, run the build script 
    npm run build
With the dependencies installed, build using electron framework electron-rebuild
*****************************************************************************************************************************
Run the electron packaging script 
   npm run electron-pack ''' *******************execute.exe'''
To prep Electron for development on Windows
   npm run electron-dev-win ''' ****************ready for development ''' Comfirm your NODE version Verify node -v from the command line/terminal
*****************************************************************************************************************************
If the machine needs to run multiple version of Node you can use the 'n' utility:
   npm install -g n
To upgrade to the latest stable version with 'n'
   n stable
To switch to a specific version with 'n'
   n 10.16.0
*****************************************************************************************************************************
The testing and development environments are using the Brave browser.
Front End developers For front-end development, the team is using the Brave browser with extensions (vs Chrome or Firefox)
Download brave browser Add React dev ext and redux tools for UI Development.....

*****************************************************************************************************************************
Git Large Files Storage
EXAMPLE:

git init repo

git lfs install

git lfs track "*.psd"

git add .gitattributes


Last step your normal git flow:

git add file.psd
git commit -m "Add design file"
git push origin master


******************************************************************************************************************************

