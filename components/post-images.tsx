export function PostImages({ images, title }: { images: string[]; title: string }) {
  if (!images.length) return null;
  return (
    <div className={`post-images post-images-${Math.min(images.length, 3)}`}>
      {images.slice(0, 3).map((image, index) => (
        <img key={`${image}-${index}`} src={image} alt={`${title}，图片 ${index + 1}`} />
      ))}
    </div>
  );
}
