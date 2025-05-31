import { useEffect, useRef, useState } from 'react';
import { RoundButton } from './ui/round-button';
const buttonStates = ['ready', 'active', 'charging', 'engaging'] as const;
type ButtonState = (typeof buttonStates)[number];

export function StealthButton() {
  const [buttonState, setButtonState] = useState<ButtonState>('ready');
  const [secondsInStep, setSecondsInStep] = useState(0);
  const startTime = useRef(0);
  const remainingSeconds = (secondsInStep > 0 ? secondsInStep - (Date.now() - startTime.current) / 1000 : 0).toFixed();

  useEffect(() => {
    startTime.current = Date.now();
    if (buttonState === 'engaging') {
      setSecondsInStep(10);
      const interval = setTimeout(() => {
        setButtonState('active');
      }, 10 * 1000);
      return () => clearTimeout(interval);
    }
    if (buttonState === 'active') {
      setSecondsInStep(30);
      const interval = setTimeout(() => {
        setButtonState('charging');
      }, 30 * 1000);
      return () => clearTimeout(interval);
    }
    if (buttonState === 'charging') {
      setSecondsInStep(10);
      const interval = setTimeout(() => {
        setButtonState('ready');
      }, 10 * 1000);
      return () => clearTimeout(interval);
    }
    if (buttonState === 'ready') {
      setSecondsInStep(0);
    }
  }, [buttonState]);

  const handleButtonClick = () => {
    if (buttonState === 'ready') {
      setButtonState('engaging');
    } else if (buttonState === 'active') {
      setButtonState('charging');
    } else if (buttonState === 'charging') {
    } else if (buttonState === 'engaging') {
    }
  };
  return <RoundButton text={`Stealth: ${buttonStateToTitle[buttonState]}, ${remainingSeconds}`} state={buttonState} onClick={handleButtonClick} />;
}

const buttonStateToTitle = {
  ready: 'Ready',
  active: 'Active',
  charging: 'Charging',
  engaging: 'Engaging',
};

const useStealthCharging = (isCharging: boolean) => {
  useEffect(() => {}, [isCharging]);
};
