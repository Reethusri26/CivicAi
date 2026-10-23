import { CheckCircle2, LocateFixed, X } from "lucide-react";
import { useState } from "react";
import { osmEmbed } from "../../lib/format";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";

export interface LocationValue {
  address: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  addressError?: string;
  disabled?: boolean;
}

const GEO_ERRORS: Record<number, string> = {
  1: "Location permission was denied. You can type the address instead.",
  2: "Your location could not be determined. Please type the address.",
  3: "Finding your location took too long. Please try again or type the address.",
};

export function LocationPicker({ value, onChange, addressError, disabled }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("This browser can't share location. Please type the address.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setAccuracy(Math.round(position.coords.accuracy));
        onChange({
          ...value,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      (error) => {
        setLocating(false);
        setGeoError(GEO_ERRORS[error.code] || GEO_ERRORS[2]);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const hasCoords = value.latitude !== null && value.longitude !== null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Pin the exact spot</p>
            <p className="text-xs text-slate-500">Optional, but it helps the field team find the issue quickly.</p>
          </div>
          {hasCoords ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange({ ...value, latitude: null, longitude: null })}
              icon={<X className="size-4" />}
            >
              Remove pin
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={locate} loading={locating} disabled={disabled} icon={<LocateFixed className="size-4" />}>
              Use my current location
            </Button>
          )}
        </div>

        {geoError && <p className="mt-3 text-sm text-amber-800" role="status">{geoError}</p>}

        {hasCoords && (
          <div className="mt-3 space-y-2">
            <p className="flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" aria-hidden />
              Location captured ({value.latitude}, {value.longitude})
              {accuracy !== null && <span className="text-slate-500"> · ±{accuracy} m</span>}
            </p>
            <iframe
              title="Map preview of the captured location"
              src={osmEmbed(value.latitude!, value.longitude!)}
              className="h-48 w-full rounded-lg border border-slate-200"
              loading="lazy"
            />
          </div>
        )}
      </div>

      <Input
        label="Address"
        placeholder="Street, area, ward or village"
        value={value.address}
        onChange={(event) => onChange({ ...value, address: event.target.value })}
        error={addressError}
        hint={hasCoords ? "Recommended even with a pin" : "Required if you don't share your location"}
        maxLength={300}
        disabled={disabled}
        autoComplete="street-address"
      />
      <Input
        label="Nearby landmark"
        placeholder="e.g. opposite Government School"
        value={value.landmark}
        onChange={(event) => onChange({ ...value, landmark: event.target.value })}
        maxLength={120}
        disabled={disabled}
      />
    </div>
  );
}
