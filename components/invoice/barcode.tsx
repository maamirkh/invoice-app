'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
}

export function Barcode({ value, width = 2, height = 50 }: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
      } catch {
        // Invalid barcode value - silently handle
      }
    }
  }, [value, width, height]);

  return <svg ref={svgRef} />;
}
