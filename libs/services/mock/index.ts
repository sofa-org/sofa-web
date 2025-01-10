import './products';
import './products-diy';
import './points';
import './auth';
import './automator';

export function isMockEnabled(): false | 'always' | 'whenError' {
  const m = window.location.search.match(/apply-mock=(\w+)/i);
  if (!m) return false;
  if (m[1].toLowerCase() == 'always') return 'always';
  return 'whenError';
}
