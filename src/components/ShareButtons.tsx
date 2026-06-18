import { Button } from "@/components/ui/button";
import { Share2, MessageCircle } from "lucide-react";
import { whatsappUrl, viberUrl, nativeShare } from "@/lib/share";
import { toast } from "sonner";

interface Props {
  title: string;
  text: string;
  url: string;
}

export function ShareButtons({ title, text, url }: Props) {
  const onNative = async () => {
    const ok = await nativeShare({ title, text, url });
    if (!ok) {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Линкът е копиран");
      } catch {
        toast.error("Неуспешно споделяне");
      }
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Сподели</h2>
      <div className="grid grid-cols-3 gap-2">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={whatsappUrl(text, url)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={viberUrl(text, url)}>
            <MessageCircle className="h-4 w-4" />Viber
          </a>
        </Button>
        <Button onClick={onNative} variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />Още
        </Button>
      </div>
    </div>
  );
}
