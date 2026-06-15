import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  priority?: boolean;
  linked?: boolean;
}

const LOGO_SRC = "/gohoos-logo.png?v=3";

export default function Logo({
  className = "h-11 w-auto",
  priority = false,
  linked = false,
}: LogoProps) {
  const image = (
    <Image
      src={LOGO_SRC}
      alt="GoHoos"
      width={800}
      height={232}
      priority={priority}
      unoptimized
      className={`object-contain ${className}`}
    />
  );

  if (linked) {
    return (
      <Link href="/" className="inline-flex shrink-0 items-center justify-start">
        {image}
      </Link>
    );
  }

  return image;
}
