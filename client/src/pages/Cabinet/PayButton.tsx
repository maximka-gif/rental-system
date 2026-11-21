import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { goToCheckout, startCheckout } from "../../api/payments";
import { formatMoney } from "../../utils/format";

type Props = {
  invoiceId: string;
  amount: number;
  size?: "sm" | "md";
  onError: (message: string) => void;
};

export function PayButton({ invoiceId, amount, size = "md", onError }: Props) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const result = await startCheckout(invoiceId);
      goToCheckout(result);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Не вдалося почати оплату");
      setLoading(false);
    }
  }

  return (
    <Button size={size} loading={loading} onClick={pay}>
      <CreditCard size={16} />
      Оплатити {formatMoney(amount)}
    </Button>
  );
}