import { ServiceResult } from "../../types";
import { userService } from "../user/user.service";
import { walletService } from "../wallet/wallet.service";
import { PublicUser } from "../user/user.types";
import { WalletBalances } from "../wallet/wallet.types";
import { hashPassword, verifyPassword } from "./password";
import { signToken } from "./token";
import { RegisterBody, LoginBody } from "./auth.schemas";

// ─────────────────────────────────────────────
// Auth service — orchestrates account identity + wallet creation and issues
// session tokens. This is the one place that knows both user and wallet
// modules, keeping each of those modules single-purpose.
// ─────────────────────────────────────────────

export interface AuthResult {
  token: string;
  user: PublicUser;
  wallet: WalletBalances;
}

function register(input: RegisterBody): ServiceResult<AuthResult> {
  const passwordHash = hashPassword(input.password);

  // 1. Create the account identity (also enforces unique username).
  const userResult = userService.create({
    username: input.username,
    displayName: input.displayName ?? input.username,
    passwordHash,
  });
  if (!userResult.ok) return userResult;
  const user = userResult.data;

  // 2. Provision the wallet with default balances.
  const walletResult = walletService.createForUser(user.id);
  if (!walletResult.ok) return walletResult;

  return {
    ok: true,
    data: {
      token: signToken(user.id),
      user: userService.toPublicUser(user),
      wallet: walletService.toBalances(walletResult.data),
    },
  };
}

function login(input: LoginBody): ServiceResult<AuthResult> {
  const userResult = userService.getByUsername(input.username);
  // Same generic message whether the username or password is wrong.
  if (!userResult.ok || !verifyPassword(input.password, userResult.data.passwordHash)) {
    return { ok: false, error: "Invalid username or password", code: 401 };
  }
  const user = userResult.data;

  const walletResult = walletService.getBalances(user.id);
  if (!walletResult.ok) return walletResult;

  return {
    ok: true,
    data: {
      token: signToken(user.id),
      user: userService.toPublicUser(user),
      wallet: walletResult.data,
    },
  };
}

export const authService = { register, login };
