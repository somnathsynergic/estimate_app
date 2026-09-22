export type PriceType = "price" | "new_ptr"

export type PriceSelectionItem = {
  price?: number
  new_ptr?: number
  priceType?: PriceType
  basePrice?: number
  effectivePrice?: number
  quantity?: number
  discount?: number
  [key: string]: any
}

export const getSelectedPriceValue = (item?: PriceSelectionItem, type: PriceType = "price") => {
  if (!item) return 0
  const basePrice = item?.basePrice ?? item?.price ?? 0
  const rawPrice = type === "new_ptr" ? item?.new_ptr ?? basePrice : basePrice
  const numericPrice = typeof rawPrice === "number" ? rawPrice : Number(rawPrice)
  return Number.isFinite(numericPrice) ? numericPrice : 0
}

export const buildNormalizedCartItems = (products: PriceSelectionItem[] = [], defaultType: PriceType = "price") =>
  products.map(item => {
    const resolvedType = item?.priceType || defaultType
    return {
      ...item,
      basePrice: item?.basePrice ?? item?.price ?? 0,
      priceType: resolvedType,
      effectivePrice: getSelectedPriceValue(item, resolvedType),
    }
  })

export const applyPriceSelectionToItems = (
  products: PriceSelectionItem[] = [],
  nextType: PriceType,
  itemId?: number,
) =>
  products.map(item => {
    if (itemId != null && item.item_id !== itemId) return item
    const resolvedType = nextType
    return {
      ...item,
      priceType: resolvedType,
      effectivePrice: getSelectedPriceValue(item, resolvedType),
      basePrice: item?.basePrice ?? item?.price ?? 0,
    }
  })

export const calculateCartTotals = (products: PriceSelectionItem[] = []) => {
  return products.reduce(
    (acc, item) => {
      const unitPrice = getSelectedPriceValue(item, item?.priceType || "price")
      const quantity = Number(item?.quantity || 0)
      const totalAmount = acc.totalAmount + unitPrice * quantity
      const discount = Number(item?.discount || 0)
      const totalDiscount = acc.totalDiscount + (discount * quantity)
      return { totalAmount, totalDiscount }
    },
    { totalAmount: 0, totalDiscount: 0 },
  )
}
