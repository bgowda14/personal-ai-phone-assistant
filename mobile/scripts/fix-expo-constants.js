// expo-constants' iOS build script runs `basename $PROJECT_DIR` unquoted, which
// breaks when the project path contains spaces ("AI phone assistant"): the
// script silently skips generating app.config and the release app crashes on launch.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', 'expo-constants', 'scripts', 'get-app-config-ios.sh');
if (fs.existsSync(file)) {
  const src = fs.readFileSync(file, 'utf8');
  const fixed = src.replace('$(basename $PROJECT_DIR)', '$(basename "$PROJECT_DIR")');
  if (fixed !== src) fs.writeFileSync(file, fixed);
}
