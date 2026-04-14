Building apk
npx expo prebuild (Create android folder)
cd android
gradlew clean
cd ..
npx expo run:android (connect phone with usb debugging on)

3 Main folders are:
app: Frontend
src: backend and mesh features
android: Make BLE work on android

Files added
android/app/src/main/AndroidManifest.xml (handles permissions)

ANDROID FOLDER
For gyatt
✔ Folder exists:
android/app/src/main/java/com/<yourusername>/mobile/ble/
✔ Files inside:
BLEServerModule.java
BLEServerPackage.java
✔ Package line in BOTH files:
package com.<yourusername>.mobile.ble;
✔ MainApplication.kt updated ✔
✔ You added React bridge ✔
✔ You called:
startBLEServer();

Rebuild apk after changing native/android code
npx eas build --platform android --profile development

Gradlew
cd android
.\gradlew assembleDebug --info
