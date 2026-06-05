import { SharePlanView } from "@/components/SharePlanView";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  return <SharePlanView token={token} />;
}
