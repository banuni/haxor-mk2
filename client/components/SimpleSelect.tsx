import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function SimpleSelect({ options, defaultValue, onChange }: { options: string[]; defaultValue: string; onChange: (value: string) => void }) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
