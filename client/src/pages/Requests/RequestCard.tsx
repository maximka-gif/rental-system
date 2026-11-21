import { Building2, Image as ImageIcon, MessageSquare, User } from "lucide-react";
import { Badge } from "../../components/ui/Badge/Badge";
import { fileUrl } from "../../api/client";
import type { MaintenanceRequest } from "../../api/requests";
import { formatMoney, timeAgo } from "../../utils/format";
import { priorityView, requestStatusView } from "./requestView";
import styles from "./Requests.module.scss";

type Props = {
  request: MaintenanceRequest;
  showTenant?: boolean;
  showStatus?: boolean;
  onClick: () => void;
};

export function RequestCard({ request, showTenant = false, showStatus = false, onClick }: Props) {
  const priority = priorityView[request.priority];
  const status = requestStatusView[request.status];

  return (
    <button className={styles.card} data-priority={request.priority} onClick={onClick}>
      <div className={styles.cardTop}>
        <span className={styles.priorityTag}>{priority.label}</span>
        <span className={styles.time}>{timeAgo(request.createdAt)}</span>
      </div>

      <h4 className={styles.cardTitle}>{request.title}</h4>

      <p className={styles.cardLine}>
        <Building2 size={14} />
        {request.property.title}
      </p>

      {showTenant && request.tenant && (
        <p className={styles.cardLine}>
          <User size={14} />
          {request.tenant.name}
        </p>
      )}

      {request.coverUrl && <img className={styles.cardImg} src={fileUrl(request.coverUrl)} alt="" />}

      <div className={styles.cardFoot}>
        {showStatus && (
          <Badge tone={status.tone} icon={status.icon}>
            {status.label}
          </Badge>
        )}
        <span className={styles.stat}>
          <MessageSquare size={14} />
          {request.commentsCount}
        </span>
        <span className={styles.stat}>
          <ImageIcon size={14} />
          {request.photosCount}
        </span>
        {request.cost !== null && request.cost > 0 && (
          <strong className={styles.cardCost}>{formatMoney(request.cost)}</strong>
        )}
      </div>
    </button>
  );
}