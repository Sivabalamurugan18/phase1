import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DigitalClockProps {
  use24Hour?: boolean;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ use24Hour = false }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeFormat = use24Hour ? 'HH:mm:ss' : 'hh:mm:ss aa';
  const dateFormat = 'EEEE, MMMM d, yyyy';

  return (
    <div className="font-mono">
      <div className="text-base text-gray-700">
        {format(time, timeFormat)} - {format(time, dateFormat)}
      </div>
    </div>
  );
};

export default DigitalClock;