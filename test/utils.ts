import { BigNumberish, solidityPacked } from "ethers"

export interface MetaTransaction {
  to: string
  value: BigNumberish
  data: string
  operation: number
}

export const encodeMultisendPayload = (txs: MetaTransaction[]): string => {
  return (
    "0x" +
    txs
      .map((tx) =>
        solidityPacked(
          ["uint8", "address", "uint256", "uint256", "bytes"],
          [tx.operation, tx.to, tx.value, (tx.data.length - 2) / 2, tx.data],
        ).slice(2),
      )
      .join("")
  )
}
