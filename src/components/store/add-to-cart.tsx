"use client";

import { useRouter } from "next/navigation";
import { readCart, saveCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/store-data";

export function AddToCart({ product }: { product: StoreProduct }) {
  const router = useRouter();
  function add() {
    const items = readCart();
    const existing = items.find((item) => item.id === product.id);
    if (existing) existing.qty += 1;
    else items.push({
      id: product.id,
      name: product.name,
      price: product.sale_price ?? product.price,
      original_price: product.price,
      type: product.type,
      slug: product.slug,
      qty: 1
    });
    saveCart(items);
    router.push("/store/cart");
  }
  return <button className="store-button primary" type="button" onClick={add}>Přidat do košíku</button>;
}
