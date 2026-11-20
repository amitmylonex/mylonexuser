import type { Admin } from './session'

export default function AdminDashboard({ account }: { account: Admin }) {
  return <>
    <h1>Admin dashboard</h1>
    <p>Welcome{account.fullName ? ', ' + account.fullName : ''}.</p>
    <dl><dt>Email</dt><dd>{account.email}</dd></dl>
  </>
}
