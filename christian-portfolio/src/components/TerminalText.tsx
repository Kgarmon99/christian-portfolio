import { useState, useEffect } from 'react';

interface TerminalTextProps {
  text: string;
  delay?: number;
  speed?: number;
}

const TerminalText = ({ text, delay = 0, speed = 30 }: TerminalTextProps) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayed(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="animate-pulse">█</span>}
    </span>
  );
};

export default TerminalText;
