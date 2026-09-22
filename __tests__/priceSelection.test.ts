import { applyPriceSelectionToItems, buildNormalizedCartItems, calculateCartTotals } from "../src/utils/priceSelection"

describe("price selection per item", () => {
  it("preserves each item's own price type instead of overwriting it with the latest selector", () => {
    const items = [
      {
        item_id: 1,
        quantity: 2,
        price: 100,
        new_ptr: 120,
        priceType: "price",
        basePrice: 100,
        effectivePrice: 100,
      },
      {
        item_id: 2,
        quantity: 1,
        price: 200,
        new_ptr: 240,
        priceType: "new_ptr",
        basePrice: 200,
        effectivePrice: 240,
      },
    ] as any

    const normalized = buildNormalizedCartItems(items, "new_ptr")

    expect(normalized[0].priceType).toBe("price")
    expect(normalized[0].effectivePrice).toBe(100)
    expect(normalized[1].priceType).toBe("new_ptr")
    expect(normalized[1].effectivePrice).toBe(240)
  })

  it("calculates totals from each stored price type", () => {
    const items = [
      {
        item_id: 1,
        quantity: 2,
        price: 100,
        new_ptr: 120,
        priceType: "price",
        basePrice: 100,
        effectivePrice: 100,
      },
      {
        item_id: 2,
        quantity: 1,
        price: 200,
        new_ptr: 240,
        priceType: "new_ptr",
        basePrice: 200,
        effectivePrice: 240,
      },
    ] as any

    const totals = calculateCartTotals(items)

    expect(totals.totalAmount).toBe(440)
    expect(totals.totalDiscount).toBe(0)
  })

  it("recomputes effective price when the selection changes between navigations", () => {
    const items = [
      {
        item_id: 1,
        quantity: 1,
        price: 100,
        new_ptr: 120,
        priceType: "price",
        basePrice: 100,
        effectivePrice: 100,
      },
    ] as any

    const normalized = buildNormalizedCartItems(items, "new_ptr")

    expect(normalized[0].priceType).toBe("price")
    expect(normalized[0].effectivePrice).toBe(100)
  })

  it("updates an existing cart item when the current price type changes", () => {
    const items = [
      {
        item_id: 1,
        quantity: 1,
        price: 100,
        new_ptr: 120,
        priceType: "price",
        basePrice: 100,
        effectivePrice: 100,
      },
    ] as any

    const updated = applyPriceSelectionToItems(items, "new_ptr", 1)

    expect(updated[0].priceType).toBe("new_ptr")
    expect(updated[0].effectivePrice).toBe(120)
  })
})
