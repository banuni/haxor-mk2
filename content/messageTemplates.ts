// system messages
export const getAnalysisMessage = (targetName: string, algorithmName: string) => {
  return `Analyzing - target: ${targetName} algorithm: ${algorithmName}`;
};

export const getAnalysisResultMessage = (targetName: string, algorithmName: string, timeToComplete: number, probability: number) => {
  return `Analysis result - target: ${targetName} algorithm: ${algorithmName} | estimated time to complete: ${timeToComplete} seconds | probability: ${probability}`;
};

export const getHackMessage = (targetName: string, algorithmName: string, taskType: string) => {
  return `Starting hack - target: ${targetName} algorithm: ${algorithmName} objective: ${taskType.toUpperCase()}`;
};

export const getHackResultMessage = (targetName: string, algorithmName: string, result: string) => {
  return `Hack result - target: ${targetName} algorithm: ${algorithmName} result: ${result.toUpperCase()}`;
};
