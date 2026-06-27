import { Package, Calendar, MapPin } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

interface EquipmentCardProps {
  name: string;
  category: string;
  image?: string;
  available: number;
  total: number;
  location?: string;
  onReserve?: () => void;
  onView?: () => void;
}

export function EquipmentCard({
  name,
  category,
  image,
  available,
  total,
  location,
  onReserve,
  onView,
}: EquipmentCardProps) {
  const isAvailable = available > 0;
  const availabilityPercent = (available / total) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <div className="aspect-video bg-[--secondary] rounded-lg mb-4 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[--muted-foreground]" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-[--foreground]">{name}</h3>
            <Badge variant={isAvailable ? 'success' : 'danger'}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
          <p className="text-sm text-[--muted-foreground]">{category}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[--muted-foreground]">Available</span>
          <span className="font-medium text-[--foreground]">
            {available} / {total}
          </span>
        </div>

        <div className="w-full bg-[--secondary] rounded-full h-2 overflow-hidden">
          <div
            className="bg-[--primary-blue] h-full rounded-full transition-all"
            style={{ width: `${availabilityPercent}%` }}
          />
        </div>

        {location && (
          <div className="flex items-center gap-2 text-sm text-[--muted-foreground]">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}

        <Button
          variant={isAvailable ? 'primary' : 'outline'}
          size="sm"
          className="w-full"
          disabled={!isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            onReserve?.();
          }}
        >
          {isAvailable ? 'Reserve Now' : 'Currently Unavailable'}
        </Button>
      </div>
    </Card>
  );
}
