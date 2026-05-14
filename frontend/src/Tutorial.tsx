import React from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step, EventData } from 'react-joyride';

interface TutorialProps {
  run: boolean;
  onFinish: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ run, onFinish }) => {
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2>Welcome to your EVMS Dashboard</h2>
          <p>This guided tour will quickly show you how to read your project's health and interpret the Earned Value metrics. Let's get started!</p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '.tour-summary',
      content: (
        <div>
          <h3>Project Health Overview</h3>
          <p>These cards translate complex EVMS math into plain English. At a glance, you can see if you are bleeding money or falling behind schedule.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-scurve',
      content: (
        <div>
          <h3>Cumulative S-Curve</h3>
          <p>This chart visualizes performance over time. The <strong>blue line</strong> is what you planned. If the <strong>red line</strong> (Actual Cost) goes above the blue line, you are overspending!</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.tour-ipmr',
      content: (
        <div>
          <h3>IPMR Format 1 Table</h3>
          <p>This breaks down exactly which Work Breakdown Structures (WBS) are causing problems. Look for the <strong>Red Badges</strong> to instantly spot failing tasks.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.tooltip-container',
      content: (
        <div>
          <h3>Acronym Definitions</h3>
          <p>Forget what CPI means? Any time you see a dotted underline, simply hover your mouse over it to see a detailed, plain-English explanation.</p>
        </div>
      ),
      placement: 'bottom',
    }
  ];

  const handleJoyrideEvent = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      options={{
        showProgress: true,
        primaryColor: '#3b82f6',
        zIndex: 10000,
      }}
      onEvent={handleJoyrideEvent}
      styles={{
        tooltipContainer: {
          textAlign: 'left'
        }
      }}
    />
  );
};
