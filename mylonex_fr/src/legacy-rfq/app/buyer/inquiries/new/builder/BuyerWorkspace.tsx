"use client";
import Builder from "./Builder";

export default function BuyerWorkspace({ buyerId }: { buyerId: string }) {
  return <Builder buyerId={buyerId} />;
}
