import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Button } from "../../components/ui/Button/Button";
import { useCreateInvite } from "../../hooks/useTenants";
import type { InviteResult, TenantListItem } from "../../api/tenants";
import styles from "./Tenants.module.scss";

type Props = {
  tenant: TenantListItem | null;
  onClose: () => void;
};

export function InviteModal({ tenant, onClose }: Props) {
  const createInvite = useCreateInvite();
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // при відкритті для нового орендаря одразу створюємо запрошення
  useEffect(() => {
    if (!tenant) {
      return;
    }

    setInvite(null);
    setError("");
    setCopied(false);

    createInvite
      .mutateAsync(tenant.id)
      .then(setInvite)
      .catch((e) => setError(e instanceof Error ? e.message : "Не вдалося створити запрошення"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id]);

  async function copy() {
    if (!invite) {
      return;
    }
    await navigator.clipboard.writeText(invite.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open={tenant !== null} title="Запросити орендаря" onClose={onClose}>
      <div className={styles.invite}>
        <p>
          Надішліть це посилання орендарю {tenant?.firstName} {tenant?.lastName}. За ним він
          створить пароль і отримає свій кабінет.
        </p>

        {!invite && !error && <p className={styles.muted}>Створюємо посилання...</p>}

        {error && <div className={styles.alert}>{error}</div>}

        {invite && (
          <>
            <div className={styles.linkBox}>
              <input readOnly value={invite.link} onFocus={(e) => e.target.select()} />
              <Button size="sm" onClick={copy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Скопійовано" : "Копіювати"}
              </Button>
            </div>
            <p className={styles.muted}>
              Посилання діє до {new Date(invite.expiresAt).toLocaleDateString("uk-UA")}. Нове
              посилання скасовує попереднє.
            </p>
          </>
        )}

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Закрити
          </Button>
        </div>
      </div>
    </Modal>
  );
}