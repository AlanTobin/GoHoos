import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
  className?: string;
}

export default function AppScreenshot({
  src,
  alt,
  caption,
  priority = false,
  className = "",
}: Props) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-xl border border-uva-navy/10 bg-white shadow-md">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          priority={priority}
          unoptimized
          className="h-auto w-full"
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-white/55">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
