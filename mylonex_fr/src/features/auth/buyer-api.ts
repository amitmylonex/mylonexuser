import { request } from '../../shared/api';
import { loadProfile } from '../profile/api/profileStore';

export type Buyer = {
  id: string
  email: string
  role: 'BUYER'
  fullName: string | null
  buyerProfile: { company: string | null; phone: string | null; gstNumber: string | null } | null
}

export type SignupInput = {
  email: string
  password: string
  fullName: string
  company: string
  phone: string
  gstNumber: string
  agreedToTerms: boolean
}

type SignupResult = { status: 'confirmation_required' } |
  { status: 'signed_in'; accessToken: string; refreshToken: string }

export const registerBuyer = (input: SignupInput) => request<SignupResult>('/buyer/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(input),
});

export const verifyBuyer = (token: string) => request<Buyer>('/buyer/session', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token },
});

export const readBuyer = (token: string) => loadProfile(token);
