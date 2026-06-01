import { useState } from "react";

export function useMap() {
  const [isMapReady, setIsMapReady] = useState(false);

  return { isMapReady, setIsMapReady };
}
