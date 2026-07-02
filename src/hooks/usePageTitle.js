import { useEffect } from 'react';

/**
 * Set the document title (and optionally meta description) per page.
 * Lightweight SEO helper — no external package needed.
 *
 * Usage:  usePageTitle('Login', 'Sign in to manage your shop');
 */
export default function usePageTitle(title, description) {
  useEffect(() => {
    const base = 'Mini Manager ERP';
    document.title = title ? `${title} — ${base}` : `${base} — দোকান ম্যানেজমেন্ট ও ইনভেন্টরি সফটওয়্যার`;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}
