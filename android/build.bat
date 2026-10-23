@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
cd /d %~dp0
if not exist gradlew.bat call C:\Users\yeliz\.gradle\wrapper\dists\gradle-8.7-bin\bhs2wmbdwecv87pi65oeuq5iu\gradle-8.7\bin\gradle.bat wrapper --gradle-version 8.7 -q
call gradlew.bat %* --console=plain
