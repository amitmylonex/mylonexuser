export type BuyerProfile = {
  id: string; email: string; role: 'BUYER'; fullName: string | null
  createdAt: string; updatedAt: string; avatarUrl: string | null
  buyerProfile: { company: string | null; phone: string | null; gstNumber: string | null
    address: string | null; designation: string | null; state: string | null; city: string | null
    pincode: string | null; updatedAt: string } | null
}
