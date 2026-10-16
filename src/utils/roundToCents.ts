// DP-10: los montos se manejan como `number` y se redondean a 2 decimales.
export const roundToCents = (value: number): number => Math.round(value * 100) / 100
