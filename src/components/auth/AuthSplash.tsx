import Image from "next/image";

/** Full-screen brand loader shown while auth state resolves or a redirect runs. */
export default function AuthSplash({ label = "Loading terminal…" }: { label?: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#08080A] text-[#ECECEA]">
      <Image
        src="/upcome-mark.svg"
        alt="Upcome"
        width={40}
        height={40}
        className="h-10 w-10 animate-upblink"
        priority
      />
      <span className="font-mono text-[12px] tracking-[.16em] uppercase text-[#6E6E76]">
        {label}
      </span>
    </div>
  );
}
