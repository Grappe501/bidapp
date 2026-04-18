import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type GenerationErrorNoticeProps = {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
};

export function GenerationErrorNotice({
  message,
  onRetry,
  disabled,
}: GenerationErrorNoticeProps) {
  return (
    <Card className="space-y-3 border-amber-200/90 bg-amber-50/40 p-4 text-xs">
      <p className="text-amber-950">
        <span className="font-semibold">Generation did not complete.</span>{" "}
        Your draft text, grounding bundle, and section selection are unchanged.
      </p>
      <p className="text-amber-950/90">{message}</p>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={onRetry}
      >
        Retry same action
      </Button>
    </Card>
  );
}
