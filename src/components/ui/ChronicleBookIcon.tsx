import type { SVGProps } from 'react';

export function ChronicleBookIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
    <path d="M8 8c6-2 12-1 16 2 4-3 10-4 16-2v29c-6-1-12 0-16 3-4-3-10-4-16-3Z" fill="#d7c49b" stroke="#e9d7ad" strokeWidth="2" strokeLinejoin="round" />
    <path d="M24 10v30M10 12v23c5-1 10 0 14 3m14-26v23c-5-1-10 0-14 3" stroke="#7b6249" strokeWidth="1.6" />
    <path d="M5 9h5v28l14 4c-6 0-13-1-19-3Zm38 0h-5v28l-14 4c6 0 13-1 19-3Z" fill="#7b3d32" stroke="#d3a36d" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14 17h6m-6 5h6m-6 5h5m9-10h6m-6 5h6m-6 5h5" stroke="#8f7653" strokeWidth="1.7" strokeLinecap="round" />
    <path d="m29 7 4-4 2 2-4 4-1 5-3 2 1-5Z" fill="#efe2bf" stroke="#68553c" strokeWidth="1.2" />
    <circle cx="24" cy="41" r="2" fill="#d8b16c" />
  </svg>;
}
