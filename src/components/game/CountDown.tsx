import { useEffect, useState } from "react";
import { TimerRing } from "./TimerRing";

type Props = {
  initialSeconds?: number;
  onEnd: () => void;
  setRemaining: (s: number) => void;
};

export function CountDown({ initialSeconds = 60, onEnd, setRemaining }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 0) return 0;
        return s - 1;
      });
    }, 1000);
    return () => {
      setRemaining(seconds);
      clearInterval(id);
    };
  });

  useEffect(() => {
    if (seconds === 0) onEnd();
  }, [seconds, onEnd]);

  return <TimerRing value={seconds} max={initialSeconds} />;
}
