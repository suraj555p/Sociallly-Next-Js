// src/app/create/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreateReelForm from "@/components/CreateReelForm";

export default async function CreatePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Create Reel</h1>
      <CreateReelForm />
    </div>
  );
}