type Props = {
  publicId: string;
  alt: string;
  variant?: "card" | "thumbnail" | "hero" | "original";
  className?: string;
  width?: number;
  height?: number;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

function buildUrl(publicId: string, variant: Props["variant"]): string {
  if (!CLOUD_NAME) {
    return "https://placehold.co/800x600/E1F5EE/0F6E56?text=Property";
  }

  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

  const transforms: Record<NonNullable<Props["variant"]>, string> = {
    thumbnail: "c_fill,w_400,h_300,q_auto,f_auto",
    card: "c_fill,w_640,h_480,q_auto,f_auto",
    hero: "c_limit,w_1200,h_900,q_auto,f_auto",
    original: "q_auto,f_auto",
  };

  const transform = transforms[variant || "card"];
  return `${base}/${transform}/${publicId}`;
}

export default function CloudinaryImage({
  publicId,
  alt,
  variant = "card",
  className = "",
  width,
  height,
}: Props) {
  const src = buildUrl(publicId, variant);

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
