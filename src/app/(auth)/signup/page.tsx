import { signup } from "./actions";
import Link from "next/link";

export default function SignupPage() {
  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold">Thread</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          アカウントを作成してください
        </p>
      </div>
      <form action={signup} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          サインアップ
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        アカウントをお持ちの方は{" "}
        <Link href="/login" className="underline hover:text-foreground">
          ログイン
        </Link>
      </p>
    </>
  );
}
