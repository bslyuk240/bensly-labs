export type DeviceType = "android" | "ios" | "desktop";

export function detectDevice(ua: string): DeviceType {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "desktop";
}
