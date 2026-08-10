export function FeedLoading() {
  return (
    <div className="loading-stack" aria-label="正在载入">
      {[0, 1, 2].map((item) => <div className="loading-card" key={item} />)}
    </div>
  );
}
