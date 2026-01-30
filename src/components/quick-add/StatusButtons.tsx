import { memo } from 'react';
import { Clock, ShoppingCart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Status } from '@/types';

interface StatusButtonsProps {
  value: Status;
  onChange: (status: Status) => void;
}

const STATUS_OPTIONS: { value: Status; label: string; icon: React.ElementType; activeClass: string }[] = [
  {
    value: 'pending',
    label: 'En attente',
    icon: Clock,
    activeClass: 'bg-muted text-foreground border-muted-foreground/50'
  },
  {
    value: 'to_buy',
    label: 'À acheter',
    icon: ShoppingCart,
    activeClass: 'bg-warning/20 text-warning border-warning'
  },
  {
    value: 'purchased',
    label: 'Acheté',
    icon: CheckCircle,
    activeClass: 'bg-success/20 text-success border-success'
  }
];

export const StatusButtons = memo(function StatusButtons({ value, onChange }: StatusButtonsProps) {
  return (
    <div className="flex gap-2">
      {STATUS_OPTIONS.map(option => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'flex-1 gap-1.5 transition-all',
              isActive && option.activeClass
            )}
            onClick={() => onChange(option.value)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
});
