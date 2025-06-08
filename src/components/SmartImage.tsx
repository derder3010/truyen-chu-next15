import Image, { ImageProps } from "next/image";

const CDN_DOMAIN = "https://img-cdn.doctruyenfull.io.vn";

/**
 * UniversalSmartImage – resize ảnh từ mọi URL qua CDN
 * • Nếu src đã nằm ở CDN => giữ nguyên
 * • Nếu là ảnh từ nơi khác => chuyển thành URL CDN có resize
 */
export default function SmartImage(props: ImageProps) {
  const { src, width, height, fill, alt = "", ...rest } = props;

  const useWidth = width || 800;
  const useHeight = height || 600;

  let finalSrc = src as string;

  const isAlreadyCdn =
    typeof finalSrc === "string" && finalSrc.startsWith(CDN_DOMAIN);

  if (!isAlreadyCdn && typeof finalSrc === "string") {
    // Encode lại path của ảnh gốc để gắn vào CDN
    const encoded = encodeURIComponent(finalSrc);
    finalSrc = `${CDN_DOMAIN}/w${useWidth}-h${useHeight}/${encoded}`;
  }

  // Trả về ảnh theo fill hoặc width/height
  if (fill) {
    return <Image {...rest} src={finalSrc} fill={fill} alt={alt} unoptimized />;
  }

  if (width && height) {
    return (
      <Image
        {...rest}
        src={finalSrc}
        width={width}
        height={height}
        alt={alt}
        unoptimized
      />
    );
  }

  return <Image {...props} alt={alt} />;
}
