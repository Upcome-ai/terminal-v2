import type { ReactNode } from "react";

export const DISCORD_URL = "https://discord.gg/etZEZaYFM9";
export const TELEGRAM_URL = "https://t.me/+XmQWp44yS2hiYTFk";

function DiscordIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[15px] w-[15px] shrink-0"
    >
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.446 3a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25A.077.077 0 0 0 8.575 3a19.736 19.736 0 0 0-4.871 1.37.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[15px] w-[15px] shrink-0"
    >
      <path d="M23.953 4.57a1.06 1.06 0 0 0-1.437-.99L1.05 11.86c-.9.36-.89 1.66.02 1.99l5.51 1.94 2.13 6.84c.24.77 1.24.99 1.79.4l3.05-3.23 5.63 4.14c.63.46 1.53.13 1.71-.64l3.06-14.87c.01-.03.01-.06.01-.09-.01-.24-.03-.5-.03-.77ZM9.6 15.36l-.32 4.53-1.62-5.24 9.02-5.7-7.08 6.41Z" />
    </svg>
  );
}

type CommunityLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

function CommunityLink({ href, label, icon }: CommunityLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Join us on ${label}`}
      className="flex flex-1 items-center justify-center gap-[7px] rounded-[8px] border border-[#1E1E23] bg-[#0E0E11] px-[10px] py-[8px] font-mono text-[12px] text-[#8A8A90] transition-colors hover:border-[#33261A] hover:bg-[#140F09] hover:text-[#F5922E]"
    >
      {icon}
      {label}
    </a>
  );
}

/** Discord + Telegram community links, styled for the Upcome terminal. */
export default function CommunityLinks({
  className = "",
  heading,
}: {
  className?: string;
  heading?: string;
}) {
  return (
    <div className={className}>
      {heading && (
        <div className="px-[2px] pb-[9px]">
          <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[#6E6E76]">
            {heading}
          </span>
        </div>
      )}
      <div className="flex items-center gap-[8px]">
        <CommunityLink href={DISCORD_URL} label="Discord" icon={<DiscordIcon />} />
        <CommunityLink href={TELEGRAM_URL} label="Telegram" icon={<TelegramIcon />} />
      </div>
    </div>
  );
}
