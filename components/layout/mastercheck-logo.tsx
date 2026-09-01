import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { height: 24, width: 130 },
  md: { height: 28, width: 152 },
  lg: { height: 40, width: 218 },
} as const;

type MasterCheckLogoProps = {
  className?: string;
  size?: keyof typeof SIZES;
  priority?: boolean;
};

export function MasterCheckLogo({
  className,
  size = "md",
  priority = false,
}: MasterCheckLogoProps) {
  const { height, width } = SIZES[size];

  return (
    <Image
      src="/mastercheck-logo.png"
      alt="MasterCheck"
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "h-auto w-auto object-contain",
        // PNG branco sobre preto: invert no tema claro; screen esconde o fundo no dark
        "invert dark:invert-0 dark:mix-blend-screen",
        className,
      )}
      style={{ maxHeight: height }}
    />
  );
}
