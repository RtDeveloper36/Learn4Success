import { preload } from 'react-dom';
import { BRAND } from '@/lib/brand';
import { WelcomePage } from '@/components/welcome/WelcomePage';

export default function Home() {
  // The hero seal is the LCP element: preload it with high priority.
  preload(BRAND.seal, { as: 'image', fetchPriority: 'high' });
  return <WelcomePage />;
}
