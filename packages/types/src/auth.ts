export const buyerProfiles = [
  "primary-residence-buyer",
  "diaspora-investor",
  "family-representative",
] as const;

export const userRoles = ["BUYER", "AGENT", "ADMIN"] as const;

export const otpCodeLength = 6;

export type BuyerProfile = (typeof buyerProfiles)[number];
export type UserRole = (typeof userRoles)[number];

export type RegisterInput = {
  buyerProfile: BuyerProfile;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
};

export type SignInInput = {
  email: string;
  keepSignedIn: boolean;
  password: string;
};

export type OtpVerificationInput = {
  code: string;
};

export type SessionUser = {
  email: string;
  id: string;
  name: string;
  role: UserRole;
};
