import { cn } from '../../lib/utils';

export function RoundButton({ text, state, onClick }: { text: string; state: 'ready' | 'active' | 'charging' | 'engaging'; onClick: () => void }) {
  const stateClasses = {
    ready: 'bg-green-400',
    active: 'bg-blue-500',
    charging: 'bg-orange-500',
    engaging: 'bg-yellow-500',
  };
  return (
    <button
      className={cn(
        'relative items-center justify-center inline-block p-4 px-5 py-3 overflow-hidden font-medium text-indigo-600 rounded-full shadow-2xl group size-32'
      )}
      onClick={onClick}
    >
      <span
        className={cn('absolute top-0 left-0 w-40 h-40 -mt-10 -ml-3 transition-all duration-700 rounded-full blur-md ease', stateClasses[state])}
      ></span>
      <span className="absolute inset-0 w-full h-full transition duration-700 group-hover:rotate-180 ease">
        {state === 'ready' ? (
          <>
            <span className="absolute bottom-0 left-0 w-28 h-28 -ml-10 bg-green-700 rounded-full blur-md"></span>
            <span className="absolute bottom-0 right-0 w-28 h-28 -mr-10 bg-gray-500 rounded-full blur-md"></span>
            <span className="absolute bottom-0 right-0 w-28 h-28 -mb-10 bg-yellow-800 rounded-full blur-md"></span>
          </>
        ) : null}
      </span>
      <span className="relative text-white">{text}</span>
    </button>
  );
}
