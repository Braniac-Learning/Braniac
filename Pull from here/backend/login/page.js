import { auth } from "@/auth"

export default async function HomePage() {
  const session = await auth()

  if (!session) {
    return <a href="/login">Login</a>
  }

  return (
    <div>
      <p>Signed in as {session.user?.email}</p>

      <form action="/api/auth/signout" method="post">
        <button type="submit">Sign out</button>
      </form>
    </div>
  )
}
