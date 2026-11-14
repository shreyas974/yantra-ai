export default function BrandMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M24 3 43 14v20L24 45 5 34V14Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="m14 15 10 9 10-9M24 24v12M14 33V15M34 33V15" stroke="currentColor" strokeWidth="2.7" strokeLinecap="square" />
    <circle cx="24" cy="24" r="3" fill="currentColor" />
  </svg>;
}
