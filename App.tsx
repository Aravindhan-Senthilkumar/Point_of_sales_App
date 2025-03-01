import React from 'react'
import AuthStack from './src/navigator/AuthStack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useAuthStore from './src/store/useAuthStore';
import AgentStack from './src/navigator/AgentStack';
import AdminStack from './src/navigator/AdminStack';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const MainContent = () => {
  const { authUser } = useAuthStore();
  return (
    <>
    { authUser === 'Agent' ? (<AgentStack />): null}
    { authUser === 'Admin' ? (<AdminStack />): null}
    { authUser === null || authUser === undefined ? (<AuthStack />): null}  
    </>
  )
}

const App = () => {
  return (
    <PaperProvider>
      <SafeAreaProvider>
      <MainContent />
      </SafeAreaProvider>
      </PaperProvider>
  )
}

export default App
