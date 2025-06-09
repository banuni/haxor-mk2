import { Button } from './ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useRef } from 'react';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';

const allowedLevels = ['basic', 'pro', 'premium'];

export function UserSettingsModal({
  username,
  setUsername,
  systemLevel,
  setSystemLevel,
}: {
  username: string;
  setUsername: (username: string) => void;
  systemLevel: 'basic' | 'pro' | 'premium';
  setSystemLevel: (systemLevel: 'basic' | 'pro' | 'premium') => void;
}) {
  const fieldRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog>
      <DialogTrigger>
        <Button>Settings</Button>
      </DialogTrigger>
      <DialogContent className="max-w-96">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div className="flex gap-2 justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-500">Username</div>
              <div className="flex gap-2 pb-4 max-w-48">
                <Input type="text" placeholder="Username" ref={fieldRef} defaultValue={username} />
                <DialogClose asChild>
                  <Button onClick={() => setUsername(fieldRef.current?.value ?? '')}>Set</Button>
                </DialogClose>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-32">
              <div className="text-sm text-gray-500">System Tier</div>
              {['basic', 'pro', 'premium'].map((level) => (
                <Button
                  disabled={!allowedLevels.includes(level)}
                  variant={systemLevel === level ? 'default' : 'outline'}
                  onClick={() => setSystemLevel(level as 'basic' | 'pro' | 'premium')}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
