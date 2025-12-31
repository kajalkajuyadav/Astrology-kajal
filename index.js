/**
 * @format
 */

import { AppRegistry } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import App from './App';
import { name as appName } from './app.json';
import backgroundFetchHeadlessTask from './src/Components/Astrologers/background/backgroundFetchHeadlessTask';

// ✅ Allows BackgroundFetch events to run when app is terminated (Android).
BackgroundFetch.registerHeadlessTask(backgroundFetchHeadlessTask);

AppRegistry.registerComponent(appName, () => App);

