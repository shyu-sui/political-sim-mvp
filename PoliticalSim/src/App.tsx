import { useState } from 'react';
import './App.css';
import Timeline from './components/TimeLine';
import StartScreen, { type CharType } from './components/start/StartScreen';
import RulesScreen from './components/rules/RulesScreen';
import IntroConversation from './components/intro/IntroConversation';
import type { BeliefScore } from './types/gameTypes';

type Screen = 'start' | 'rules' | 'intro' | 'game';

type PlayerConfig = {
  playerName: string;
  charType:   CharType;
  belief?:    BeliefScore;
} | null;

function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [config, setConfig] = useState<PlayerConfig>(null);

  // StartScreen → RulesScreen → IntroConversation → Game
  const handleStart = (playerName: string, charType: CharType) => {
    setConfig({ playerName, charType });
    setScreen('rules');
  };

  const handleContinue = () => {
    setConfig(null); // TimeLine will call loadGame()
    setScreen('game');
  };

  const handleRulesSkip = () => {
    setScreen('intro');
  };

  const handleRulesNext = () => {
    setScreen('intro');
  };

  const handleIntroComplete = (belief: BeliefScore) => {
    setConfig(prev => prev ? { ...prev, belief } : prev);
    setScreen('game');
  };

  const handleReturnToStart = () => {
    setScreen('start');
    setConfig(null);
  };

  if (screen === 'start') {
    return <StartScreen onStart={handleStart} onContinue={handleContinue} />;
  }

  if (screen === 'rules') {
    return <RulesScreen onSkip={handleRulesSkip} onNext={handleRulesNext} />;
  }

  if (screen === 'intro') {
    return (
      <IntroConversation
        playerName={config?.playerName ?? ''}
        onComplete={handleIntroComplete}
      />
    );
  }

  return (
    <div className="page">
      <Timeline initialConfig={config} onReturnToStart={handleReturnToStart} />
    </div>
  );
}

export default App;
