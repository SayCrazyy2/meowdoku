// Official Meowdoku Palette 0 extracted from game assets
// Matches the official mobile game screenshot exactly
export interface RegionColor {
  id: number;
  name: string;
  hex: string;
  border: string;
}

export const OFFICIAL_COLORS: RegionColor[] = [
  { id: 0, name: "Rose", hex: "#CA6784", border: "#a64964" },
  { id: 1, name: "Lime", hex: "#82CD72", border: "#62ab53" },
  { id: 2, name: "Steel Blue", hex: "#4A709D", border: "#35547a" },
  { id: 3, name: "Lavender", hex: "#7F71D2", border: "#5e51b3" },
  { id: 4, name: "Sky Blue", hex: "#98BEE2", border: "#749fc7" },
  { id: 5, name: "Orange", hex: "#F29454", border: "#c97034" },
  { id: 6, name: "Forest Green", hex: "#24854F", border: "#186138" },
  { id: 7, name: "Brown", hex: "#A06543", border: "#7a4a2f" },
  { id: 8, name: "Pink", hex: "#F092DE", border: "#c767b4" },
  { id: 9, name: "Gold", hex: "#C49D00", border: "#997a00" },
  { id: 10, name: "Teal", hex: "#32A0B7", border: "#21788a" },
  { id: 11, name: "Cream", hex: "#F3D170", border: "#cca849" },
];

export function getRegionColor(regionId: number): RegionColor {
  const index = Math.abs(regionId) % OFFICIAL_COLORS.length;
  return OFFICIAL_COLORS[index];
}
