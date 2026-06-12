export const STANDARD_DELIVERY = 199;

export function getDeliveryCharge(productSubtotal: number): {
  charge: number;
  discount: number;
  discountPercent: number;
  label: string;
} {
  let discountPercent = 0;
  let label = "Standard delivery";
  if (productSubtotal >= 3000) {
    discountPercent = 100;
    label = "Free delivery";
  } else if (productSubtotal >= 2500) {
    discountPercent = 50;
    label = "50% delivery discount";
  } else if (productSubtotal >= 1500) {
    discountPercent = 30;
    label = "30% delivery discount";
  }
  const discount = Math.round((STANDARD_DELIVERY * discountPercent) / 100);
  const charge = STANDARD_DELIVERY - discount;
  return { charge, discount, discountPercent, label };
}
