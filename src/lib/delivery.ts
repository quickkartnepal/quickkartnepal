export const STANDARD_DELIVERY = 150;

export function getDeliveryCharge(_productSubtotal: number): {
  charge: number;
  discount: number;
  discountPercent: number;
  label: string;
} {
  return { charge: STANDARD_DELIVERY, discount: 0, discountPercent: 0, label: "Standard delivery" };
}
