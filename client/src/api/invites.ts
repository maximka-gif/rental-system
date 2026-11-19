import { api } from "./client";
import type { User } from "./auth";

export type InviteInfo = {
  firstName: string;
  lastName: string;
  email: string;
  ownerName: string;
};

export type AcceptResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export function fetchInvite(token: string) {
  return api<InviteInfo>(`/invites/${token}`);
}

export function acceptInvite(token: string, password: string) {
  return api<AcceptResponse>(`/invites/${token}/accept`, {
    method: "POST",
    body: { password },
  });
}