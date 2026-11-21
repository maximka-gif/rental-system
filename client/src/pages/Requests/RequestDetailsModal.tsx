import { useEffect, useState } from "react";
import { Ban, Check, Send, Wrench } from "lucide-react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { fileUrl } from "../../api/client";
import { useAddComment, useChangeStatus, useRequest } from "../../hooks/useRequests";
import { formatDateTime, formatMoney } from "../../utils/format";
import { priorityView, requestStatusView } from "./requestView";
import { cn } from "../../utils/cn";
import styles from "./Requests.module.scss";

type Mode = null | "complete" | "reject";

type Props = {
  requestId: string | null;
  role: "OWNER" | "TENANT";
  onClose: () => void;
};

export function RequestDetailsModal({ requestId, role, onClose }: Props) {
  const { data, isLoading, isError } = useRequest(requestId);
  const addComment = useAddComment();
  const changeStatus = useChangeStatus();

  const [mode, setMode] = useState<Mode>(null);
  const [cost, setCost] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(null);
    setCost("");
    setText("");
    setError("");
  }, [requestId]);

  async function sendComment() {
    if (!data || text.trim() === "") {
      return;
    }

    setError("");
    try {
      await addComment.mutateAsync({ id: data.id, text: text.trim() });
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося надіслати повідомлення");
    }
  }

  async function run(status: "IN_PROGRESS" | "DONE" | "REJECTED", costValue?: number) {
    if (!data) {
      return;
    }

    setError("");
    try {
      await changeStatus.mutateAsync({ id: data.id, status, cost: costValue });
      setMode(null);
      setCost("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося змінити статус");
    }
  }

  function complete() {
    let value: number | undefined;

    if (cost.trim() !== "") {
      value = Number(cost);
      if (Number.isNaN(value) || value < 0) {
        setError("Вартість має бути числом, не меншим за 0");
        return;
      }
    }

    run("DONE", value);
  }

  const status = data ? requestStatusView[data.status] : null;
  const priority = data ? priorityView[data.priority] : null;
  const canAct = role === "OWNER" && data && (data.status === "NEW" || data.status === "IN_PROGRESS");

  return (
    <Modal open={requestId !== null} title={data ? data.title : "Заявка"} onClose={onClose}>
      {isLoading && <p>Завантаження...</p>}
      {isError && <div className={styles.alert}>Не вдалося завантажити заявку</div>}

      {data && status && priority && (
        <div className={styles.stack}>
          <div className={styles.badges}>
            <Badge tone={status.tone} icon={status.icon}>
              {status.label}
            </Badge>
            <Badge tone={priority.tone}>{priority.label}</Badge>
          </div>

          <dl className={styles.meta}>
            <div>
              <dt>Об'єкт</dt>
              <dd>{data.property.title}</dd>
            </div>
            {role === "OWNER" && data.tenant && (
              <div>
                <dt>Орендар</dt>
                <dd>{data.tenant.name}</dd>
              </div>
            )}
            <div>
              <dt>Створено</dt>
              <dd>{formatDateTime(data.createdAt)}</dd>
            </div>
          </dl>

          <p className={styles.description}>{data.description}</p>

          {data.photos.length > 0 && (
            <div className={styles.gallery}>
              {data.photos.map((photo) => (
                <a key={photo.id} href={fileUrl(photo.url)} target="_blank" rel="noreferrer">
                  <img src={fileUrl(photo.url)} alt="Фото несправності" />
                </a>
              ))}
            </div>
          )}

          {data.status === "DONE" && (
            <div className={styles.success}>
              Заявку виконано
              {data.cost !== null && data.cost > 0 ? `. Вартість ремонту: ${formatMoney(data.cost)}` : ""}
            </div>
          )}

          {data.status === "REJECTED" && <div className={styles.info}>Заявку відхилено</div>}

          <section className={styles.chatBlock}>
            <h4>Обговорення</h4>

            <div className={styles.chat}>
              {data.comments.length === 0 && <p className={styles.muted}>Повідомлень поки немає</p>}

              {data.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(styles.bubble, comment.author.role === role && styles.mine)}
                >
                  <span className={styles.bubbleMeta}>
                    {comment.author.name}, {formatDateTime(comment.createdAt)}
                  </span>
                  <span>{comment.text}</span>
                </div>
              ))}
            </div>

            <div className={styles.commentForm}>
              <input
                placeholder="Напишіть повідомлення"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendComment();
                  }
                }}
              />
              <Button size="sm" loading={addComment.isPending} onClick={sendComment} aria-label="Надіслати">
                <Send size={16} />
              </Button>
            </div>
          </section>

          {mode === "complete" && (
            <div className={styles.subForm}>
              <Input
                label="Вартість ремонту, грн (необов'язково)"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
              <p className={styles.muted}>Якщо вказати суму, вона автоматично потрапить у витрати по об'єкту.</p>
              <div className={styles.footer}>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Скасувати
                </Button>
                <Button loading={changeStatus.isPending} onClick={complete}>
                  Завершити заявку
                </Button>
              </div>
            </div>
          )}

          {mode === "reject" && (
            <div className={styles.subForm}>
              <p>Відхилити цю заявку? Далі змінити її статус буде не можна.</p>
              <div className={styles.footer}>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Ні
                </Button>
                <Button variant="danger" loading={changeStatus.isPending} onClick={() => run("REJECTED")}>
                  Відхилити
                </Button>
              </div>
            </div>
          )}

          {error && <div className={styles.alert}>{error}</div>}

          {canAct && mode === null && (
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setMode("reject")}>
                <Ban size={16} />
                Відхилити
              </Button>

              {data.status === "NEW" && (
                <Button loading={changeStatus.isPending} onClick={() => run("IN_PROGRESS")}>
                  <Wrench size={16} />
                  Взяти в роботу
                </Button>
              )}

              {data.status === "IN_PROGRESS" && (
                <Button onClick={() => setMode("complete")}>
                  <Check size={16} />
                  Завершити
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}