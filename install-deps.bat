@echo off
echo Installing backend dependencies for Video Recording...
cd services\api
npm install multer uuid
npm install -D @types/multer @types/uuid

echo Installing frontend dependencies for WebRTC...
cd ..\..\apps\patient-web
npm install socket.io-client
cd ..\doctor-web
npm install socket.io-client
cd ..\..

echo Dependencies installed successfully!
